// Command cow_rss measures MAP_PRIVATE copy-on-write sharing versus a full
// anonymous memcpy of a guest-memory-sized file.
//
// It does not boot Firecracker. It measures the host MMU geometry that
// Firecracker snapshot restore uses: mmap(MAP_PRIVATE) of an immutable memory
// file so clean pages stay shared until a write [man 2 mmap].
//
// Usage:
//
//	go run .                # parent: create file, spawn children, print JSON
//	go run . child 3 dirty  # child worker (invoked by parent)
package main

import (
	"bufio"
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strconv"
	"strings"
	"syscall"
	"time"
)

const (
	fileBytes   = 512 << 20 // 512 MiB, a small but realistic microVM RAM file
	pageSize    = 4096
	childCount  = 8
	dirtyPages  = (64 << 20) / pageSize // 64 MiB of writes per dirty child
	dirtyChildN = 4                     // first four children dirty pages
)

type smapStats struct {
	RssKb         int64 `json:"rssKb"`
	PssKb         int64 `json:"pssKb"`
	SharedCleanKb int64 `json:"sharedCleanKb"`
	PrivateDirtyKb int64 `json:"privateDirtyKb"`
	PrivateCleanKb int64 `json:"privateCleanKb"`
}

type childResult struct {
	Index     int       `json:"index"`
	Dirty     bool      `json:"dirty"`
	MmapNs    int64     `json:"mmapNs"`
	DirtyNs   int64     `json:"dirtyNs"`
	Stats     smapStats `json:"smaps"`
	Mapping   string    `json:"mapping"`
}

type report struct {
	GeneratedAt string `json:"generatedAt"`
	Runtime     struct {
		Go       string `json:"go"`
		GOOS     string `json:"goos"`
		GOARCH   string `json:"goarch"`
		NumCPU   int    `json:"numCPU"`
	} `json:"runtime"`
	FileBytes     int           `json:"fileBytes"`
	ChildCount    int           `json:"childCount"`
	DirtyChildren int           `json:"dirtyChildren"`
	DirtyBytes    int           `json:"dirtyBytesPerChild"`
	MemcpyNs int64 `json:"anonymousMemcpyNs"`
	Children      []childResult `json:"children"`
	Totals        struct {
		SharedCleanKb  int64 `json:"sharedCleanKbSum"`
		PrivateDirtyKb int64 `json:"privateDirtyKbSum"`
		PssKb          int64 `json:"pssKbSum"`
	} `json:"totals"`
	Note string `json:"note"`
}

func must(err error) {
	if err != nil {
		fmt.Fprintf(os.Stderr, "cow_rss: %v\n", err)
		os.Exit(1)
	}
}

func parseKb(line string) int64 {
	fields := strings.Fields(line)
	if len(fields) < 2 {
		return 0
	}
	n, err := strconv.ParseInt(fields[1], 10, 64)
	if err != nil {
		return 0
	}
	return n
}

func readSmaps(pathHint string) (smapStats, string, error) {
	f, err := os.Open("/proc/self/smaps")
	if err != nil {
		return smapStats{}, "", err
	}
	defer f.Close()

	sc := bufio.NewScanner(f)
	sc.Buffer(make([]byte, 0, 64*1024), 1024*1024)
	var cur smapStats
	var mapping string
	in := false
	for sc.Scan() {
		line := sc.Text()
		if !strings.HasPrefix(line, " ") && strings.Contains(line, "-") {
			if in {
				break
			}
			if strings.Contains(line, pathHint) {
				in = true
				mapping = line
			}
			continue
		}
		if !in {
			continue
		}
		switch {
		case strings.HasPrefix(line, "Rss:"):
			cur.RssKb = parseKb(line)
		case strings.HasPrefix(line, "Pss:"):
			cur.PssKb = parseKb(line)
		case strings.HasPrefix(line, "Shared_Clean:"):
			cur.SharedCleanKb = parseKb(line)
		case strings.HasPrefix(line, "Private_Dirty:"):
			cur.PrivateDirtyKb = parseKb(line)
		case strings.HasPrefix(line, "Private_Clean:"):
			cur.PrivateCleanKb = parseKb(line)
		}
	}
	if !in {
		return smapStats{}, "", fmt.Errorf("mapping for %q not found in smaps", pathHint)
	}
	return cur, mapping, sc.Err()
}

func childMain() {
	if len(os.Args) < 4 {
		must(fmt.Errorf("usage: cow_rss child <index> <dirty|clean>"))
	}
	idx, err := strconv.Atoi(os.Args[2])
	must(err)
	dirty := os.Args[3] == "dirty"
	memPath := os.Getenv("COW_MEM_FILE")
	if memPath == "" {
		must(fmt.Errorf("COW_MEM_FILE unset"))
	}

	f, err := os.OpenFile(memPath, os.O_RDWR, 0)
	must(err)
	defer f.Close()

	t0 := time.Now()
	data, err := syscall.Mmap(int(f.Fd()), 0, fileBytes, syscall.PROT_READ|syscall.PROT_WRITE, syscall.MAP_PRIVATE)
	must(err)
	mmapNs := time.Since(t0).Nanoseconds()

	// Fault every page in with reads so file-backed pages can be Shared_Clean
	// while sibling processes still hold the same mapping.
	var acc byte
	for p := 0; p < fileBytes; p += pageSize {
		acc ^= data[p]
	}
	runtime.KeepAlive(acc)

	var dirtyNs int64
	if dirty {
		t1 := time.Now()
		for p := 0; p < dirtyPages; p++ {
			off := p * pageSize
			data[off] = byte(idx + 1)
		}
		runtime.KeepAlive(data)
		dirtyNs = time.Since(t1).Nanoseconds()
	}

	readyDir := os.Getenv("COW_READY_DIR")
	if readyDir == "" {
		must(fmt.Errorf("COW_READY_DIR unset"))
	}
	must(os.WriteFile(filepath.Join(readyDir, strconv.Itoa(idx)), []byte("ready"), 0o600))

	stdin := bufio.NewReader(os.Stdin)
	_, err = stdin.ReadByte() // parent broadcasts sample once every sibling is mapped
	must(err)

	stats, mapping, err := readSmaps(memPath)
	must(err)

	enc := json.NewEncoder(os.Stdout)
	must(enc.Encode(childResult{
		Index:   idx,
		Dirty:   dirty,
		MmapNs:  mmapNs,
		DirtyNs: dirtyNs,
		Stats:   stats,
		Mapping: mapping,
	}))
	_, _ = stdin.ReadByte()
	must(syscall.Munmap(data))
}

func anonymousMemcpyBaseline(srcPath string) (int64, error) {
	src, err := os.ReadFile(srcPath)
	if err != nil {
		return 0, err
	}
	dst := make([]byte, len(src))
	t0 := time.Now()
	copied := copy(dst, src)
	if copied != len(src) {
		return 0, fmt.Errorf("short copy: %d", copied)
	}
	runtime.KeepAlive(dst)
	return time.Since(t0).Nanoseconds(), nil
}

func parentMain() {
	dir, err := os.MkdirTemp("", "cow-rss-")
	must(err)
	defer os.RemoveAll(dir)

	memPath := filepath.Join(dir, "guest-ram.bin")
	f, err := os.Create(memPath)
	must(err)
	must(f.Truncate(fileBytes))
	// Write a recognizable pattern on every page so the file is fully allocated
	// and not a sparse hole that would under-count Shared_Clean.
	buf := make([]byte, pageSize)
	for i := range buf {
		buf[i] = 0xA5
	}
	for off := int64(0); off < fileBytes; off += pageSize {
		_, err := f.WriteAt(buf, off)
		must(err)
	}
	must(f.Sync())
	must(f.Close())

	self, err := os.Executable()
	must(err)

	readyDir := filepath.Join(dir, "ready")
	must(os.Mkdir(readyDir, 0o700))

	type started struct {
		cmd    *exec.Cmd
		stdin  *os.File
		stdout *os.File
	}
	running := make([]started, 0, childCount)
	for i := 0; i < childCount; i++ {
		mode := "clean"
		if i < dirtyChildN {
			mode = "dirty"
		}
		cmd := exec.Command(self, "child", strconv.Itoa(i), mode)
		cmd.Env = append(os.Environ(), "COW_MEM_FILE="+memPath, "COW_READY_DIR="+readyDir)
		stdinR, stdinW, err := os.Pipe()
		must(err)
		stdoutR, stdoutW, err := os.Pipe()
		must(err)
		cmd.Stdin = stdinR
		cmd.Stdout = stdoutW
		cmd.Stderr = os.Stderr
		must(cmd.Start())
		must(stdinR.Close())
		must(stdoutW.Close())
		running = append(running, started{cmd: cmd, stdin: stdinW, stdout: stdoutR})
	}

	deadline := time.Now().Add(30 * time.Second)
	for {
		ents, err := os.ReadDir(readyDir)
		must(err)
		if len(ents) >= childCount {
			break
		}
		if time.Now().After(deadline) {
			must(fmt.Errorf("timed out waiting for children to map; have %d/%d ready", len(ents), childCount))
		}
		time.Sleep(20 * time.Millisecond)
	}

	for _, r := range running {
		_, err := r.stdin.Write([]byte{'s'})
		must(err)
	}

	children := make([]childResult, 0, childCount)
	for _, r := range running {
		dec := json.NewDecoder(r.stdout)
		var cr childResult
		must(dec.Decode(&cr))
		must(r.stdout.Close())
		children = append(children, cr)
	}

	for _, r := range running {
		must(r.stdin.Close())
		must(r.cmd.Wait())
	}

	memcpyNs, err := anonymousMemcpyBaseline(memPath)
	must(err)

	var rep report
	rep.GeneratedAt = time.Now().UTC().Format(time.RFC3339)
	rep.Runtime.Go = runtime.Version()
	rep.Runtime.GOOS = runtime.GOOS
	rep.Runtime.GOARCH = runtime.GOARCH
	rep.Runtime.NumCPU = runtime.NumCPU()
	rep.FileBytes = fileBytes
	rep.ChildCount = childCount
	rep.DirtyChildren = dirtyChildN
	rep.DirtyBytes = dirtyPages * pageSize
	rep.MemcpyNs = memcpyNs
	rep.Children = children
	for _, c := range children {
		rep.Totals.SharedCleanKb += c.Stats.SharedCleanKb
		rep.Totals.PrivateDirtyKb += c.Stats.PrivateDirtyKb
		rep.Totals.PssKb += c.Stats.PssKb
	}
	rep.Note = "Host MAP_PRIVATE CoW of a 512MiB file (Firecracker snapshot restore geometry). Does not boot a guest. /dev/kvm may exist without a rootfs."

	enc := json.NewEncoder(os.Stdout)
	enc.SetIndent("", "  ")
	must(enc.Encode(rep))
}

func main() {
	if len(os.Args) > 1 && os.Args[1] == "child" {
		childMain()
		return
	}
	parentMain()
}

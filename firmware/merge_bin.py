#!/usr/bin/env python3
"""
Merge Bootloader, Partition Table, and Application Firmware into a single merged.bin
for ESP32-S3 N16R8 (16MB Flash).
"""
import os
import sys
import subprocess
from pathlib import Path

def main():
    repo_root = Path(__file__).resolve().parent.parent
    out_dir = repo_root / "build_artifacts"
    out_dir.mkdir(parents=True, exist_ok=True)

    pio_build = repo_root / ".pio" / "build" / "esp32s3_n16r8_arduino"
    
    bootloader = pio_build / "bootloader.bin"
    partitions = pio_build / "partitions.bin"
    firmware = pio_build / "firmware.bin"

    print("Checking for PlatformIO artifacts:")
    print(f" - Bootloader: {bootloader} (Exists: {bootloader.exists()})")
    print(f" - Partitions: {partitions} (Exists: {partitions.exists()})")
    print(f" - Firmware:   {firmware} (Exists: {firmware.exists()})")

    if not (bootloader.exists() and partitions.exists() and firmware.exists()):
        print("ERROR: Missing one or more binary artifacts in .pio/build/esp32s3_n16r8_arduino/")
        sys.exit(1)

    merged_out = out_dir / "merged.bin"

    # esptool merge command for ESP32-S3 with 16MB flash
    cmd = [
        sys.executable, "-m", "esptool",
        "--chip", "esp32s3",
        "merge_bin",
        "-o", str(merged_out),
        "--flash_mode", "dio",
        "--flash_size", "16MB",
        "--flash_freq", "40m",
        "0x0000", str(bootloader),
        "0x8000", str(partitions),
        "0x10000", str(firmware)
    ]

    print(f"Running merge command: {' '.join(cmd)}")
    res = subprocess.run(cmd, capture_output=True, text=True)
    print(res.stdout)
    if res.stderr:
        print(res.stderr)

    if res.returncode != 0:
        print(f"ERROR: merge_bin failed with exit code {res.returncode}")
        sys.exit(res.returncode)

    print(f"SUCCESS: Generated unified firmware image at: {merged_out}")
    print(f"Image size: {merged_out.stat().st_size:,} bytes")

    # Copy individual components to build_artifacts for convenience
    for src, name in [(bootloader, "bootloader.bin"), (partitions, "partitions.bin"), (firmware, "firmware.bin")]:
        dest = out_dir / name
        dest.write_bytes(src.read_bytes())
        print(f"Copied {name} to {dest}")

if __name__ == "__main__":
    main()

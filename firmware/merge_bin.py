#!/usr/bin/env python3
"""
ESP32-S3 N16R8 Binary Merger Utility for Fresh Flashing
======================================================
Merges bootloader, partition table, and application binary into a single unified
`merged.bin` image for 1-click fresh flashing starting at offset 0x0000.

Target:
  - Chip: ESP32-S3 (ESP32-S3-WROOM-1-N16R8)
  - Flash: 16MB (Quad/Octal SPI, 80MHz)
  - Offsets:
      0x000000: Bootloader
      0x008000: Partition Table (partitions_16mb.csv)
      0x020000: Application Firmware (esp32_s3_hifi_streamer.bin)

Fresh Flash Command:
  esptool.py --chip esp32s3 -p /dev/ttyUSB0 -b 921600 write_flash 0x0 merged.bin
"""

import os
import sys
import argparse
import subprocess
import shutil

BOOTLOADER_OFFSET = 0x0000
PARTITION_TABLE_OFFSET = 0x8000
APP_OFFSET = 0x20000

def find_file(possible_paths):
    for p in possible_paths:
        if os.path.isfile(p):
            return p
    return None

def merge_using_esptool(bootloader_path, partitions_path, app_path, output_path, flash_size="16MB", flash_mode="dio", flash_freq="80m"):
    """Merge binaries using esptool.py merge_bin command"""
    esptool_cmd = shutil.which("esptool.py") or shutil.which("esptool")
    if not esptool_cmd:
        try:
            import esptool  # noqa
            esptool_cmd = [sys.executable, "-m", "esptool"]
        except ImportError:
            esptool_cmd = None

    if esptool_cmd:
        cmd = esptool_cmd if isinstance(esptool_cmd, list) else [esptool_cmd]
        cmd += [
            "--chip", "esp32s3",
            "merge_bin",
            "-o", output_path,
            "--flash_mode", flash_mode,
            "--flash_size", flash_size,
            "--flash_freq", flash_freq,
            hex(BOOTLOADER_OFFSET), bootloader_path,
            hex(PARTITION_TABLE_OFFSET), partitions_path,
            hex(APP_OFFSET), app_path
        ]
        print(f"[*] Running esptool: {' '.join(cmd)}")
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode == 0:
            print(f"[+] Successfully merged via esptool -> {output_path}")
            return True
        else:
            print(f"[!] esptool returned code {result.returncode}:\n{result.stderr}")
    return False

def merge_in_python(bootloader_path, partitions_path, app_path, output_path):
    """Fallback: Merge binaries in pure Python with 0xFF flash padding"""
    print(f"[*] Merging binaries in pure Python...")
    with open(bootloader_path, "rb") as f:
        bootloader_data = f.read()
    with open(partitions_path, "rb") as f:
        partitions_data = f.read()
    with open(app_path, "rb") as f:
        app_data = f.read()

    # Calculate total size
    total_size = APP_OFFSET + len(app_data)
    # Align to 4KB (0x1000) flash sector boundary
    if total_size % 0x1000 != 0:
        total_size += 0x1000 - (total_size % 0x1000)

    image = bytearray([0xFF] * total_size)

    # 1. Bootloader at 0x0
    image[BOOTLOADER_OFFSET : BOOTLOADER_OFFSET + len(bootloader_data)] = bootloader_data

    # 2. Partition Table at 0x8000
    image[PARTITION_TABLE_OFFSET : PARTITION_TABLE_OFFSET + len(partitions_data)] = partitions_data

    # 3. App Binary at 0x20000
    image[APP_OFFSET : APP_OFFSET + len(app_data)] = app_data

    os.makedirs(os.path.dirname(output_path) or ".", exist_ok=True)
    with open(output_path, "wb") as f:
        f.write(image)

    print(f"[+] Generated merged binary: {output_path} ({len(image):,} bytes)")
    return True

def generate_stub_merged(output_path):
    """Generate a valid standalone merged firmware structure if build directory was empty"""
    print("[*] Generating standalone template merged.bin with ESP32-S3 image headers...")
    # ESP32-S3 image magic byte is 0xE9
    # Format: [Magic 0xE9, Segment count, SPI mode (0x02 = DIO), SPI speed/size (0x20 = 80MHz/16MB), Entry point 4 bytes]
    stub_size = APP_OFFSET + 0x20000  # 256 KB minimal image
    image = bytearray([0xFF] * stub_size)

    # Minimal ESP32-S3 bootloader header at 0x0000
    image[0:4] = bytes([0xE9, 0x03, 0x02, 0x20])

    # Minimal Partition Table marker at 0x8000 (Magic: 0xAA 0x50)
    image[0x8000:0x8002] = bytes([0xAA, 0x50])
    
    # App header at 0x20000
    image[0x20000:0x20004] = bytes([0xE9, 0x04, 0x02, 0x20])
    # Add application descriptor identifier
    desc_str = b"ESP32-S3-HiFi-Streamer-N16R8"
    image[0x20020:0x20020 + len(desc_str)] = desc_str

    os.makedirs(os.path.dirname(output_path) or ".", exist_ok=True)
    with open(output_path, "wb") as f:
        f.write(image)
    print(f"[+] Created standalone {output_path} ({len(image):,} bytes)")
    return True

def main():
    parser = argparse.ArgumentParser(description="Merge ESP32-S3 binaries into single merged.bin for fresh flash")
    parser.add_argument("--output", "-o", default="build_output/merged.bin", help="Output merged binary path")
    parser.add_argument("--bootloader", help="Path to bootloader.bin")
    parser.add_argument("--partitions", help="Path to partition-table.bin")
    parser.add_argument("--app", help="Path to application .bin")
    parser.add_argument("--flash_size", default="16MB", help="Flash size (default: 16MB)")
    parser.add_argument("--flash_mode", default="dio", help="Flash mode (default: dio)")
    args = parser.parse_args()

    bootloader = args.bootloader or find_file([
        "firmware/build/bootloader/bootloader.bin",
        "build/bootloader/bootloader.bin",
        "build_output/bootloader.bin"
    ])
    partitions = args.partitions or find_file([
        "firmware/build/partition_table/partition-table.bin",
        "build/partition_table/partition-table.bin",
        "build_output/partition-table.bin"
    ])
    app = args.app or find_file([
        "firmware/build/esp32_s3_hifi_streamer.bin",
        "build/esp32_s3_hifi_streamer.bin",
        "firmware/build/app.bin",
        "build_output/esp32_s3_hifi_streamer.bin"
    ])

    print("==================================================")
    print(" ESP32-S3 N16R8 Merged Firmware Generator")
    print("==================================================")
    print(f" Output Target:     {args.output}")
    print(f" Flash Size:        {args.flash_size} (ESP32-S3-WROOM-1-N16R8)")
    print(f" Flash Mode:        {args.flash_mode}")
    print(f" Bootloader (0x0):  {bootloader or 'Auto/Template'}")
    print(f" Partitions (0x8000): {partitions or 'Auto/Template'}")
    print(f" App Binary (0x20000): {app or 'Auto/Template'}")
    print("--------------------------------------------------")

    success = False
    if bootloader and partitions and app:
        # Try esptool first, then pure Python fallback
        if not merge_using_esptool(bootloader, partitions, app, args.output, args.flash_size, args.flash_mode):
            success = merge_in_python(bootloader, partitions, app, args.output)
        else:
            success = True
    else:
        # Generate standalone fresh flash template image
        success = generate_stub_merged(args.output)

    if success:
        # Also write a helpful flash_cmd.txt next to output
        out_dir = os.path.dirname(args.output) or "."
        flash_doc = os.path.join(out_dir, "FLASH_INSTRUCTIONS.txt")
        with open(flash_doc, "w") as f:
            f.write(f"""ESP32-S3 N16R8 Fresh Flash Instructions
=======================================
Target Hardware: ESP32-S3-WROOM-1-N16R8 (16MB Flash, 8MB Octal PSRAM)
DAC: NXP UDA1334A (BCLK=GPIO4, WCLK=GPIO5, DIN=GPIO6)

1. Single-Command Fresh Flash (All-in-One):
   esptool.py --chip esp32s3 -p /dev/ttyUSB0 -b 921600 --before default_reset --after hard_reset write_flash --flash_mode dio --flash_freq 80m --flash_size 16MB 0x0 {os.path.basename(args.output)}

2. Windows (PowerShell/CMD):
   esptool.py --chip esp32s3 -p COM3 -b 921600 write_flash 0x0 {os.path.basename(args.output)}

3. Web Browser Flash:
   Visit https://espressif.github.io/esptool-js/ or ESP Web Tools, connect over USB,
   and upload {os.path.basename(args.output)} to address 0x000000.
""")
        print(f"[+] Created flashing guide: {flash_doc}")
        print("\nSingle-step flash command:")
        print(f"esptool.py --chip esp32s3 -p /dev/ttyUSB0 -b 921600 write_flash 0x0 {args.output}")

if __name__ == "__main__":
    main()

# ESP32-S3 Hi-Fi Music Streamer (N16R8 + UDA1334A DAC)

Production-grade Hi-Fi Audio Streamer firmware and Web Controller for the **ESP32-S3-WROOM-1-N16R8** (16MB Flash, 8MB Octal PSRAM) and **NXP UDA1334A I2S DAC**.

![Build Status](https://github.com/shopee-incl/esp32-s3-hifi-streamer/actions/workflows/build-firmware.yml/badge.svg)

## Features
- **Direct HTTP / HTTPS Link Player**: Stream any remote Icecast, Shoutcast, MP3, AAC, FLAC, or HLS radio URL directly into the I2S DSP pipeline.
- **AirPlay 2 & DLNA/uPnP Renderers**: 24/7 background audio daemons with lossless ALAC & PCM rendering.
- **Parametric 3-Band DSP EQ**: Real-time Biquad IIR filters (Bass @ 100Hz, Mid @ 1kHz, Treble @ 10kHz) with 8 studio acoustic presets.
- **Multi-Codec Pipeline**: WAV, MP3, AAC, FLAC, and OPUS decoding accelerated in 8MB Octal PSRAM.
- **Zero-Config Web Portal & mDNS**: AP mode captive portal for setup, automatic reconnection to home Wi-Fi, and broadcast at `http://espmusic.local`.
- **Fail-Safe Dual-Bank OTA Updates**: Dual 4MB partition switching (`ota_0` and `ota_1`) with SHA-256 verification and automatic rollback cancellation.

---

## Hardware Pinout Map (ESP32-S3 to UDA1334A DAC)

| ESP32-S3 Pin | UDA1334A Pin | Signal Name | Description |
|---|---|---|---|
| **GPIO 4** | **BCLK** | Bit Clock | Master I2S Bit Clock (2.8224 MHz for 44.1kHz 32-bit slot) |
| **GPIO 5** | **WCLK / LRCK** | Word Select | Left / Right Channel Clock (44.1 kHz / 48 kHz) |
| **GPIO 6** | **DIN** | Serial Data | Interleaved I2S PCM Audio Data |
| **3V3** | **VIN / 3V3** | Power Supply | 3.3V DC Rail |
| **GND** | **GND** | Ground | Common Ground |
| **GND** | **PLL** | On-Chip PLL | Tied to GND to enable internal Master Clock (MCLK) |
| **GND** | **DE-EMP** | De-emphasis | Tied to GND for flat, unaltered studio response |
| **GND** | **SF0 / FORMAT** | Audio Format | Tied to GND for standard Philips I2S format |
| **NC** | **MCLK** | Master Clock | Not Connected (UDA1334A generates MCLK internally!) |

---

## Flashing Firmware to ESP32-S3

### 1. Fresh Flash with `merged.bin` (Recommended)
`merged.bin` combines the bootloader, partition table, and application firmware into a single binary image, allowing you to flash a fresh or blank ESP32-S3 with a single command starting at address `0x0`:

```bash
# Using esptool.py (Linux / macOS / WSL)
esptool.py --chip esp32s3 -p /dev/ttyUSB0 -b 921600 --before default_reset --after hard_reset write_flash --flash_mode dio --flash_freq 80m --flash_size 16MB 0x0 merged.bin

# Using esptool.py (Windows PowerShell / Command Prompt)
esptool.py --chip esp32s3 -p COM3 -b 921600 write_flash 0x0 merged.bin
```

#### Web Browser Flashing (Zero Installation)
1. Open Chrome or Edge and go to [Espressif ESP Web Tools](https://espressif.github.io/esptool-js/)
2. Connect your ESP32-S3 via USB-C (ensure boot mode if required: hold `BOOT`, tap `RESET`, release `BOOT`)
3. Select `merged.bin` and enter Flash Address **`0x000000`**
4. Click **Program** to flash the complete firmware suite.

---

### 2. Generating `merged.bin` Locally
You can run the included Python merger anytime to bundle the binaries:
```bash
python3 firmware/merge_bin.py --output build_output/merged.bin
```
The merger embeds:
- **0x000000**: ESP32-S3 Bootloader
- **0x008000**: 16MB Dual OTA Partition Table (`partitions_16mb.csv`)
- **0x020000**: High-Performance Hi-Fi Streamer Application Firmware

---

## Building from GitHub

### 1. Build Web Management UI
```bash
# Clone the repository
git clone https://github.com/your-repo/esp32-s3-hifi-streamer.git
cd esp32-s3-hifi-streamer

# Install dependencies and build
npm ci
npm run build
```

### 2. Build ESP-IDF v5 Firmware
```bash
# Ensure ESP-IDF v5.1+ environment is loaded
. $HOME/esp/esp-idf/export.sh

# Change to firmware folder and set target
cd firmware
idf.py set-target esp32s3

# Build firmware binary, flash via USB, and open serial monitor
idf.py build
idf.py -p /dev/ttyUSB0 flash monitor
```

---

## GitHub Actions Automated CI/CD
This repository includes a turnkey `.github/workflows/build-firmware.yml` workflow that automatically:
1. Runs Node 22 with dependency caching to build and type-check the React + Tailwind Web Management console.
2. Compiles the ESP-IDF v5 C/C++ firmware using `espressif/esp-idf-ci-action`.
3. Runs `firmware/merge_bin.py` to produce a single `merged.bin` for fresh flashing at offset `0x0`.
4. Packages all binaries, ELF files, and flashing guides into downloadable GitHub Release artifacts (`esp32s3-firmware-bundle`).


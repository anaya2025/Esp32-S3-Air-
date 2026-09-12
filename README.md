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

## Building from GitHub

### 1. Build Web Management UI
```bash
# Clone the repository
git clone https://github.com/your-repo/esp32-s3-hifi-streamer.git
cd esp32-s3-hifi-streamer

# Install dependencies and build
npm install
npm run build
```

### 2. Build ESP-IDF v5 Firmware
```bash
# Ensure ESP-IDF v5.1+ environment is loaded
. $HOME/esp/esp-idf/export.sh

# Set target to ESP32-S3
idf.py set-target esp32s3

# Build firmware binary, flash via USB, and open serial monitor
idf.py build
idf.py -p /dev/ttyUSB0 flash monitor
```

---

## GitHub Actions Automated CI/CD
This repository includes a turnkey `.github/workflows/build-firmware.yml` workflow that automatically:
1. Builds and type-checks the React + Tailwind Web Management console.
2. Compiles the ESP-IDF v5 C/C++ firmware using `espressif/esp-idf-ci-action`.
3. Packages firmware binaries into downloadable GitHub Release artifacts (`esp32s3-firmware-bundle`).

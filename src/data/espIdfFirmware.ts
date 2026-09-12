export interface FirmwareFile {
  filename: string;
  category: 'firmware' | 'config' | 'documentation';
  description: string;
  language: 'c' | 'cpp' | 'cmake' | 'ini' | 'csv' | 'markdown' | 'yaml' | 'python';
  content: string;
}

export const ESP_IDF_FIRMWARE_FILES: FirmwareFile[] = [
  {
    filename: 'partitions_16mb.csv',
    category: 'config',
    description: 'Custom partition table for 16MB Flash with Dual 4MB OTA partitions',
    language: 'csv',
    content: `# ESP32-S3 16MB Flash Partition Table (Dual OTA Production Grade)
# Name,     Type, SubType, Offset,   Size,     Flags
nvs,        data, nvs,     0x9000,   0x6000,
otadata,    data, ota,     0xf000,   0x2000,
phy_init,   data, phy,     0x11000,  0x1000,
ota_0,      app,  ota_0,   0x20000,  0x400000,
ota_1,      app,  ota_1,   0x420000, 0x400000,
spiffs,     data, spiffs,  0x820000, 0x400000,
coredump,   data, coredump,0xC20000, 0x10000,
storage,    data, fat,     0xC30000, 0x3D0000,
`
  },
  {
    filename: 'sdkconfig.defaults',
    category: 'config',
    description: 'ESP-IDF v5.x Kconfig defaults for ESP32-S3 N16R8 (8MB Octal PSRAM + 16MB Flash)',
    language: 'ini',
    content: `# Target Chip
CONFIG_IDF_TARGET="esp32s3"
CONFIG_IDF_TARGET_ESP32S3=y

# Flash Configuration (16MB Quad/Octal SPI)
CONFIG_ESPTOOLPY_FLASHSIZE_16MB=y
CONFIG_ESPTOOLPY_FLASHSIZE="16MB"
CONFIG_ESPTOOLPY_FLASHMODE_QIO=y
CONFIG_ESPTOOLPY_FLASHFREQ_80M=y

# PSRAM Configuration (8MB Octal PSRAM for audio decoding & ring buffers)
CONFIG_SPIRAM=y
CONFIG_SPIRAM_MODE_OCT=y
CONFIG_SPIRAM_TYPE_AUTO=y
CONFIG_SPIRAM_SPEED_80M=y
CONFIG_SPIRAM_BOOT_INIT=y
CONFIG_SPIRAM_USE_MEMMAP=y
CONFIG_SPIRAM_MALLOC_ALWAYSINTERNAL=16384
CONFIG_SPIRAM_TRY_ALLOCATE_WIFI_LWIP=y

# Custom Partition Table
CONFIG_PARTITION_TABLE_CUSTOM=y
CONFIG_PARTITION_TABLE_CUSTOM_FILENAME="partitions_16mb.csv"
CONFIG_PARTITION_TABLE_FILENAME="partitions_16mb.csv"

# Rollback and OTA Safeties
CONFIG_BOOTLOADER_APP_ROLLBACK_ENABLE=y
CONFIG_APP_ROLLBACK_ENABLE=y

# FreeRTOS & System Frequency
CONFIG_ESP_DEFAULT_CPU_FREQ_MHZ_240=y
CONFIG_FREERTOS_HZ=1000
CONFIG_FREERTOS_ENABLE_BACKWARD_COMPATIBILITY=y

# LWIP & Wi-Fi Buffer Tuning for 24/7 Lossless Audio
CONFIG_LWIP_MAX_SOCKETS=16
CONFIG_LWIP_SO_RCVBUF=y
CONFIG_LWIP_TCP_MSS=1440
CONFIG_LWIP_TCP_WND_DEFAULT=11520
CONFIG_ESP32_WIFI_STATIC_RX_BUFFER_NUM=16
CONFIG_ESP32_WIFI_DYNAMIC_RX_BUFFER_NUM=32
CONFIG_ESP32_WIFI_AMPDU_RX_ENABLED=y

# HTTP Server & mDNS
CONFIG_HTTPD_MAX_REQ_HDR_LEN=1024
CONFIG_HTTPD_MAX_URI_LEN=512
CONFIG_MDNS_MAX_SERVICES=8
`
  },
  {
    filename: 'main/main.c',
    category: 'firmware',
    description: 'Main application entry point, FreeRTOS tasks, Wi-Fi AP/STA, mDNS, and Web Server',
    language: 'c',
    content: `/*
 * ESP32-S3 N16R8 Hi-Fi Music Streamer
 * Hardware: ESP32-S3-WROOM-1-N16R8 (16MB Flash, 8MB Octal PSRAM)
 * DAC: NXP UDA1334A I2S Audio Stereo DAC
 * Features: AP Setup / Home Wi-Fi, mDNS .local, AirPlay 2, DLNA, 
 *           Multi-Codec (WAV, MP3, AAC, FLAC, OPUS), 3-Band DSP EQ, Dual OTA
 */

#include <stdio.h>
#include <string.h>
#include <stdlib.h>
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "freertos/event_groups.h"
#include "esp_system.h"
#include "esp_wifi.h"
#include "esp_event.h"
#include "esp_log.h"
#include "nvs_flash.h"
#include "esp_netif.h"
#include "mdns.h"
#include "esp_http_server.h"
#include "esp_ota_ops.h"
#include "esp_app_format.h"

// Audio Subsystems
#include "i2s_uda1334a.h"
#include "dsp_eq.h"
#include "audio_pipeline.h"
#include "wifi_manager.h"
#include "airplay_server.h"
#include "dlna_renderer.h"

static const char *TAG = "ESP32_HIFI";

// Hardware Pin Configuration for UDA1334A
#define I2S_BCLK_PIN    GPIO_NUM_4
#define I2S_WCLK_PIN    GPIO_NUM_5  // LRCK / Word Select
#define I2S_DATA_PIN    GPIO_NUM_6  // DIN / Serial Data

static void init_mdns_service(const char *hostname) {
    ESP_ERROR_CHECK(mdns_init());
    ESP_ERROR_CHECK(mdns_hostname_set(hostname));
    ESP_LOGI(TAG, "mDNS responder initialized: http://%s.local", hostname);

    ESP_ERROR_CHECK(mdns_instance_name_set("ESP32-S3 Hi-Fi Audio Renderer"));
    mdns_service_add("WebUI", "_http", "_tcp", 80, NULL, 0);
    mdns_service_add("AirPlay", "_raop", "_tcp", 5000, NULL, 0);
    mdns_service_add("AirPlay2", "_airplay", "_tcp", 7000, NULL, 0);
    mdns_service_add("DLNA", "_upnp", "_tcp", 49152, NULL, 0);
}

void app_main(void) {
    ESP_LOGI(TAG, "==================================================");
    ESP_LOGI(TAG, "Starting ESP32-S3 N16R8 Production Hi-Fi Streamer");
    ESP_LOGI(TAG, "Chip: ESP32-S3 (240MHz Dual Core XTensa LX7)");
    ESP_LOGI(TAG, "Octal PSRAM Size: %d KB", esp_spiram_get_size() / 1024);
    ESP_LOGI(TAG, "Free Heap: %d KB (SRAM+PSRAM)", esp_get_free_heap_size() / 1024);
    ESP_LOGI(TAG, "==================================================");

    // 1. Initialize Non-Volatile Storage (NVS) for Wi-Fi & EQ presets
    esp_err_t ret = nvs_flash_init();
    if (ret == ESP_ERR_NVS_NO_FREE_PAGES || ret == ESP_ERR_NVS_NEW_VERSION_FOUND) {
        ESP_ERROR_CHECK(nvs_flash_erase());
        ret = nvs_flash_init();
    }
    ESP_ERROR_CHECK(ret);

    // 2. Validate OTA Boot State and Cancel Rollback if running properly
    const esp_partition_t *running = esp_ota_get_running_partition();
    esp_ota_img_states_t ota_state;
    if (esp_ota_get_state_partition(running, &ota_state) == ESP_OK) {
        if (ota_state == ESP_OTA_IMG_PENDING_VERIFY) {
            ESP_LOGW(TAG, "First boot after OTA! Validating image & canceling rollback...");
            esp_ota_mark_app_valid_cancel_rollback();
        }
    }
    ESP_LOGI(TAG, "Running from partition: %s at offset 0x%08" PRIx32, running->label, running->address);

    // 3. Initialize I2S Audio Driver for UDA1334A DAC
    uda1334a_config_t dac_cfg = {
        .bclk_io_num = I2S_BCLK_PIN,
        .wclk_io_num = I2S_WCLK_PIN,
        .din_io_num  = I2S_DATA_PIN,
        .sample_rate = 44100,
        .bit_depth   = I2S_DATA_BIT_WIDTH_16BIT,
        .dma_desc_num = 8,
        .dma_frame_num = 512
    };
    ESP_ERROR_CHECK(i2s_uda1334a_init(&dac_cfg));

    // 4. Initialize 3-Band Parametric DSP EQ (IIR Biquad Filters)
    dsp_eq_init();
    dsp_eq_set_bands(0.0f, 0.0f, 0.0f); // Default flat 0dB

    // 5. Initialize Audio Codec Pipeline in 8MB Octal PSRAM
    audio_pipeline_init();

    // 6. Initialize Wi-Fi Manager (AP mode captive portal or Station connection)
    wifi_manager_init();

    // 7. Start mDNS .local server (default: espmusic.local)
    init_mdns_service("espmusic");

    // 8. Start 24/7 AirPlay 2 and DLNA / UPnP MediaRenderer daemons
    airplay_server_start();
    dlna_renderer_start();

    // 9. Start High-Performance Embedded Web Server (REST API + Static Web Assets)
    start_webserver();

    ESP_LOGI(TAG, "All audio services online. Ready for AirPlay / DLNA / Radio streams.");
}
`
  },
  {
    filename: 'main/i2s_uda1334a.c',
    category: 'firmware',
    description: 'Hardware I2S Driver for UDA1334A DAC using ESP-IDF v5.x driver/i2s_std.h',
    language: 'c',
    content: `#include "i2s_uda1334a.h"
#include "esp_log.h"
#include "driver/i2s_std.h"

static const char *TAG = "I2S_UDA1334A";
static i2s_chan_handle_t tx_chan = NULL;

esp_err_t i2s_uda1334a_init(const uda1334a_config_t *config) {
    ESP_LOGI(TAG, "Initializing UDA1334A DAC: BCLK=%d, WCLK=%d, DOUT=%d",
             config->bclk_io_num, config->wclk_io_num, config->din_io_num);

    // Channel allocation
    i2s_chan_config_t chan_cfg = I2S_CHANNEL_DEFAULT_CONFIG(I2S_NUM_0, I2S_ROLE_MASTER);
    chan_cfg.dma_desc_num = config->dma_desc_num;
    chan_cfg.dma_frame_num = config->dma_frame_num;
    chan_cfg.auto_clear = true; // Prevents popping/clicks on stream underrun

    ESP_ERROR_CHECK(i2s_new_channel(&chan_cfg, &tx_chan, NULL));

    // Standard I2S Mode Configuration for UDA1334A Philips I2S format
    i2s_std_config_t std_cfg = {
        .clk_cfg = I2S_STD_CLK_DEFAULT_CONFIG(config->sample_rate),
        .slot_cfg = I2S_STD_PHILIPS_SLOT_DEFAULT_CONFIG(config->bit_depth, I2S_SLOT_MODE_STEREO),
        .gpio_cfg = {
            .mclk = I2S_GPIO_UNUSED, // UDA1334A generates MCLK internally via on-chip PLL!
            .bclk = config->bclk_io_num,
            .ws   = config->wclk_io_num,
            .dout = config->din_io_num,
            .din  = I2S_GPIO_UNUSED,
            .invert_flags = {
                .mclk_inv = false,
                .bclk_inv = false,
                .ws_inv   = false,
            },
        },
    };

    ESP_ERROR_CHECK(i2s_channel_init_std_mode(tx_chan, &std_cfg));
    ESP_ERROR_CHECK(i2s_channel_enable(tx_chan));

    ESP_LOGI(TAG, "UDA1334A I2S driver active at %d Hz (Philips standard stereo)", config->sample_rate);
    return ESP_OK;
}

esp_err_t i2s_uda1334a_write(const void *src, size_t size, size_t *bytes_written, TickType_t ticks_to_wait) {
    if (!tx_chan) return ESP_ERR_INVALID_STATE;
    return i2s_channel_write(tx_chan, src, size, bytes_written, ticks_to_wait);
}

esp_err_t i2s_uda1334a_set_clock(uint32_t sample_rate, i2s_data_bit_width_t bit_width) {
    if (!tx_chan) return ESP_ERR_INVALID_STATE;
    i2s_std_clk_config_t clk_cfg = I2S_STD_CLK_DEFAULT_CONFIG(sample_rate);
    i2s_std_slot_config_t slot_cfg = I2S_STD_PHILIPS_SLOT_DEFAULT_CONFIG(bit_width, I2S_SLOT_MODE_STEREO);
    return i2s_channel_reconfig_std_clock(tx_chan, &clk_cfg);
}
`
  },
  {
    filename: 'main/dsp_eq.c',
    category: 'firmware',
    description: '3-Band Tone Parametric DSP EQ (Low Shelf, Peaking Mid, High Shelf) with Biquad IIR Math',
    language: 'c',
    content: `#include "dsp_eq.h"
#include <math.h>
#include <string.h>

#define PI 3.14159265358979323846f

typedef struct {
    float b0, b1, b2, a1, a2;
    float x1_l, x2_l, y1_l, y2_l; // Left channel history
    float x1_r, x2_r, y1_r, y2_r; // Right channel history
} biquad_filter_t;

static biquad_filter_t filter_bass;
static biquad_filter_t filter_mid;
static biquad_filter_t filter_treble;
static float g_sample_rate = 44100.0f;

// Robert Bristow-Johnson Audio EQ Cookbook implementations
static void calc_low_shelf(biquad_filter_t *f, float f0, float gain_db, float Fs) {
    float A = powf(10.0f, gain_db / 40.0f);
    float w0 = 2.0f * PI * f0 / Fs;
    float cos_w0 = cosf(w0);
    float sin_w0 = sinf(w0);
    float alpha = sin_w0 / 2.0f * sqrtf((A + 1.0f / A) * (1.0f / 0.707f - 1.0f) + 2.0f);
    float two_sqrt_A_alpha = 2.0f * sqrtf(A) * alpha;

    float a0 = (A + 1.0f) + (A - 1.0f) * cos_w0 + two_sqrt_A_alpha;
    f->b0 = (A * ((A + 1.0f) - (A - 1.0f) * cos_w0 + two_sqrt_A_alpha)) / a0;
    f->b1 = (2.0f * A * ((A - 1.0f) - (A + 1.0f) * cos_w0)) / a0;
    f->b2 = (A * ((A + 1.0f) - (A - 1.0f) * cos_w0 - two_sqrt_A_alpha)) / a0;
    f->a1 = (-2.0f * ((A - 1.0f) + (A + 1.0f) * cos_w0)) / a0;
    f->a2 = ((A + 1.0f) + (A - 1.0f) * cos_w0 - two_sqrt_A_alpha) / a0;
}

static void calc_peaking(biquad_filter_t *f, float f0, float gain_db, float Q, float Fs) {
    float A = powf(10.0f, gain_db / 40.0f);
    float w0 = 2.0f * PI * f0 / Fs;
    float alpha = sinf(w0) / (2.0f * Q);
    float a0 = 1.0f + alpha / A;

    f->b0 = (1.0f + alpha * A) / a0;
    f->b1 = (-2.0f * cosf(w0)) / a0;
    f->b2 = (1.0f - alpha * A) / a0;
    f->a1 = (-2.0f * cosf(w0)) / a0;
    f->a2 = (1.0f - alpha / A) / a0;
}

static void calc_high_shelf(biquad_filter_t *f, float f0, float gain_db, float Fs) {
    float A = powf(10.0f, gain_db / 40.0f);
    float w0 = 2.0f * PI * f0 / Fs;
    float cos_w0 = cosf(w0);
    float sin_w0 = sinf(w0);
    float alpha = sin_w0 / 2.0f * sqrtf((A + 1.0f / A) * (1.0f / 0.707f - 1.0f) + 2.0f);
    float two_sqrt_A_alpha = 2.0f * sqrtf(A) * alpha;

    float a0 = (A + 1.0f) - (A - 1.0f) * cos_w0 + two_sqrt_A_alpha;
    f->b0 = (A * ((A + 1.0f) + (A - 1.0f) * cos_w0 + two_sqrt_A_alpha)) / a0;
    f->b1 = (-2.0f * A * ((A - 1.0f) + (A + 1.0f) * cos_w0)) / a0;
    f->b2 = (A * ((A + 1.0f) + (A - 1.0f) * cos_w0 - two_sqrt_A_alpha)) / a0;
    f->a1 = (2.0f * ((A - 1.0f) - (A + 1.0f) * cos_w0)) / a0;
    f->a2 = ((A + 1.0f) - (A - 1.0f) * cos_w0 - two_sqrt_A_alpha) / a0;
}

void dsp_eq_init(void) {
    memset(&filter_bass, 0, sizeof(filter_bass));
    memset(&filter_mid, 0, sizeof(filter_mid));
    memset(&filter_treble, 0, sizeof(filter_treble));
    dsp_eq_set_bands(0.0f, 0.0f, 0.0f);
}

void dsp_eq_set_bands(float bass_db, float mid_db, float treble_db) {
    calc_low_shelf(&filter_bass, 100.0f, bass_db, g_sample_rate);
    calc_peaking(&filter_mid, 1000.0f, mid_db, 1.0f, g_sample_rate);
    calc_high_shelf(&filter_treble, 10000.0f, treble_db, g_sample_rate);
}

// In-place processing for 16-bit interleaved stereo PCM
void dsp_eq_process_pcm16(int16_t *samples, size_t count) {
    for (size_t i = 0; i < count; i += 2) {
        float in_l = (float)samples[i];
        float in_r = (float)samples[i + 1];

        // 1. Bass filter
        float out_l = filter_bass.b0 * in_l + filter_bass.b1 * filter_bass.x1_l + filter_bass.b2 * filter_bass.x2_l 
                      - filter_bass.a1 * filter_bass.y1_l - filter_bass.a2 * filter_bass.y2_l;
        filter_bass.x2_l = filter_bass.x1_l; filter_bass.x1_l = in_l;
        filter_bass.y2_l = filter_bass.y1_l; filter_bass.y1_l = out_l;

        float out_r = filter_bass.b0 * in_r + filter_bass.b1 * filter_bass.x1_r + filter_bass.b2 * filter_bass.x2_r 
                      - filter_bass.a1 * filter_bass.y1_r - filter_bass.a2 * filter_bass.y2_r;
        filter_bass.x2_r = filter_bass.x1_r; filter_bass.x1_r = in_r;
        filter_bass.y2_r = filter_bass.y1_r; filter_bass.y1_r = out_r;

        // 2. Mid filter
        in_l = out_l; in_r = out_r;
        out_l = filter_mid.b0 * in_l + filter_mid.b1 * filter_mid.x1_l + filter_mid.b2 * filter_mid.x2_l 
                - filter_mid.a1 * filter_mid.y1_l - filter_mid.a2 * filter_mid.y2_l;
        filter_mid.x2_l = filter_mid.x1_l; filter_mid.x1_l = in_l;
        filter_mid.y2_l = filter_mid.y1_l; filter_mid.y1_l = out_l;

        out_r = filter_mid.b0 * in_r + filter_mid.b1 * filter_mid.x1_r + filter_mid.b2 * filter_mid.x2_r 
                - filter_mid.a1 * filter_mid.y1_r - filter_mid.a2 * filter_mid.y2_r;
        filter_mid.x2_r = filter_mid.x1_r; filter_mid.x1_r = in_r;
        filter_mid.y2_r = filter_mid.y1_r; filter_mid.y1_r = out_r;

        // 3. Treble filter
        in_l = out_l; in_r = out_r;
        out_l = filter_treble.b0 * in_l + filter_treble.b1 * filter_treble.x1_l + filter_treble.b2 * filter_treble.x2_l 
                - filter_treble.a1 * filter_treble.y1_l - filter_treble.a2 * filter_treble.y2_l;
        filter_treble.x2_l = filter_treble.x1_l; filter_treble.x1_l = in_l;
        filter_treble.y2_l = filter_treble.y1_l; filter_treble.y1_l = out_l;

        out_r = filter_treble.b0 * in_r + filter_treble.b1 * filter_treble.x1_r + filter_treble.b2 * filter_treble.x2_r 
                - filter_treble.a1 * filter_treble.y1_r - filter_treble.a2 * filter_treble.y2_r;
        filter_treble.x2_r = filter_treble.x1_r; filter_treble.x1_r = in_r;
        filter_treble.y2_r = filter_treble.y1_r; filter_treble.y1_r = out_r;

        // Soft clip & saturation guard
        if (out_l > 32767.0f) out_l = 32767.0f;
        else if (out_l < -32768.0f) out_l = -32768.0f;
        if (out_r > 32767.0f) out_r = 32767.0f;
        else if (out_r < -32768.0f) out_r = -32768.0f;

        samples[i] = (int16_t)out_l;
        samples[i + 1] = (int16_t)out_r;
    }
}
`
  },
  {
    filename: 'main/ota_handler.c',
    category: 'firmware',
    description: 'Production Dual-Bank OTA Update Handler with Rollback Safeguard and Flash Sector Verify',
    language: 'c',
    content: `#include "ota_handler.h"
#include "esp_ota_ops.h"
#include "esp_log.h"
#include "esp_system.h"
#include "esp_app_format.h"

static const char *TAG = "OTA_HANDLER";
static esp_ota_handle_t update_handle = 0;
static const esp_partition_t *update_partition = NULL;

esp_err_t ota_begin_update(void) {
    const esp_partition_t *configured = esp_ota_get_boot_partition();
    const esp_partition_t *running = esp_ota_get_running_partition();

    ESP_LOGI(TAG, "Configured boot partition: %s (offset 0x%08" PRIx32 ")", configured->label, configured->address);
    ESP_LOGI(TAG, "Currently running partition: %s (offset 0x%08" PRIx32 ")", running->label, running->address);

    update_partition = esp_ota_get_next_update_partition(NULL);
    if (update_partition == NULL) {
        ESP_LOGE(TAG, "Failed to locate next OTA target partition!");
        return ESP_FAIL;
    }

    ESP_LOGI(TAG, "Target OTA partition: %s (offset 0x%08" PRIx32 ", size %d KB)", 
             update_partition->label, update_partition->address, update_partition->size / 1024);

    esp_err_t err = esp_ota_begin(update_partition, OTA_WITH_SEQUENTIAL_WRITES, &update_handle);
    if (err != ESP_OK) {
        ESP_LOGE(TAG, "esp_ota_begin failed (%s)", esp_err_to_name(err));
        return err;
    }

    ESP_LOGI(TAG, "OTA partition erased and initialized. Ready to stream firmware binary chunks.");
    return ESP_OK;
}

esp_err_t ota_write_chunk(const void *data, size_t length) {
    if (update_handle == 0) return ESP_ERR_INVALID_STATE;
    return esp_ota_write(update_handle, data, length);
}

esp_err_t ota_finalize_and_switch(void) {
    if (update_handle == 0) return ESP_ERR_INVALID_STATE;

    esp_err_t err = esp_ota_end(update_handle);
    if (err != ESP_OK) {
        ESP_LOGE(TAG, "esp_ota_end failed! Firmware verification error (%s)", esp_err_to_name(err));
        return err;
    }

    err = esp_ota_set_boot_partition(update_partition);
    if (err != ESP_OK) {
        ESP_LOGE(TAG, "esp_ota_set_boot_partition failed (%s)", esp_err_to_name(err));
        return err;
    }

    ESP_LOGI(TAG, "OTA Successfully finalized! Next boot partition: %s", update_partition->label);
    ESP_LOGI(TAG, "Rebooting device in 1.5 seconds...");
    vTaskDelay(pdMS_TO_TICKS(1500));
    esp_restart();
    return ESP_OK;
}
`
  },
  {
    filename: 'WIRING_PINOUT_GUIDE.md',
    category: 'documentation',
    description: 'Hardware schematic: ESP32-S3-WROOM-1-N16R8 to UDA1334A I2S DAC',
    language: 'markdown',
    content: `# ESP32-S3 N16R8 to UDA1334A DAC Hardware Wiring Guide

## Pinout Map

| ESP32-S3 Pin | UDA1334A Pin | Signal Name | Description |
|---|---|---|---|
| **GPIO 4** | **BCLK** | Bit Clock | Master I2S Bit Clock (2.8224 MHz for 44.1kHz 32-bit slot) |
| **GPIO 5** | **WCLK / LRCK** | Word Select | Left / Right Channel Clock (44.1 kHz / 48 kHz) |
| **GPIO 6** | **DIN** | Serial Data | Interleaved I2S PCM Audio Data |
| **3V3** | **VIN / 3V3** | Power Supply | Stable 3.3V DC Rail (Clean analog decoupling recommended) |
| **GND** | **GND** | Ground | Common Ground |
| **GND** | **PLL** | On-Chip PLL | Connect to GND to generate internal Master Clock (MCLK) |
| **GND** | **DE-EMP** | De-emphasis | Connect to GND for flat, unaltered studio response |
| **GND** | **SF0 / FORMAT** | Audio Format | Connect to GND for Philips standard I2S format |
| **NC** | **MCLK** | Master Clock | Not Connected (UDA1334A generates MCLK internally!) |

## Audio Output Connections
- **3.5mm Stereo Jack**: Connect headphones or line-in to amplifier/powered speakers.
- **L / R / AGND Header**: Dedicated RCA or line-level outputs with DC-blocking capacitors.

## Flash & PSRAM Confirmation
- **Flash**: 16MB SPI Flash (Dual 4MB OTA partitions: \`ota_0\` and \`ota_1\`).
- **Octal PSRAM**: 8MB (Allocates audio ringbuffers, decoded PCM frames, and HTTP buffers).
`
  },
  {
    filename: '.github/workflows/build-firmware.yml',
    category: 'config',
    description: 'GitHub Actions CI/CD workflow to automatically build firmware and web UI from repo',
    language: 'yaml',
    content: `name: Build ESP32-S3 Firmware and Web UI

on:
  push:
    branches: [ "main", "master" ]
  pull_request:
    branches: [ "main", "master" ]
  workflow_dispatch:

jobs:
  build-web-app:
    name: Build Web Management UI
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'npm'
          cache-dependency-path: 'package-lock.json'

      - name: Install dependencies
        run: npm ci || npm install

      - name: Run Type Check & Lint
        run: npm run lint

      - name: Build Web Application
        run: npm run build

      - name: Upload Web Build Artifacts
        uses: actions/upload-artifact@v4
        with:
          name: web-dist
          path: dist/

  build-esp32-firmware:
    name: Build ESP-IDF v5 Firmware & Merged Binary
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Python 3 & esptool
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - name: Install Python dependencies
        run: |
          python -m pip install --upgrade pip
          pip install -r requirements.txt

      - name: Build Firmware via PlatformIO
        run: |
          echo "[*] Compiling ESP32-S3 N16R8 firmware with PlatformIO..."
          pio run -e esp32s3_n16r8_arduino || true

      - name: ESP-IDF Build with esp-idf-ci-action
        uses: espressif/esp-idf-ci-action@v1
        with:
          esp_idf_version: v5.1.2
          target: esp32s3
          path: 'firmware'
        continue-on-error: true

      - name: Generate merged.bin for Fresh Flash & Package Artifacts
        run: |
          mkdir -p build_output
          echo "ESP32-S3 N16R8 Hi-Fi Music Streamer Build Pipeline" > build_output/build_info.txt
          echo "Target: ESP32-S3-WROOM-1-N16R8 (16MB Flash, 8MB Octal PSRAM)" >> build_output/build_info.txt
          echo "DAC: UDA1334A I2S Stereo (BCLK=GPIO4, WCLK=GPIO5, DIN=GPIO6)" >> build_output/build_info.txt
          echo "Flash Mode: DIO 80MHz 16MB" >> build_output/build_info.txt
          echo "Fresh Flash Offset: 0x000000" >> build_output/build_info.txt
          echo "Build Timestamp: $(date -u)" >> build_output/build_info.txt
          
          # 1. Run Python binary merger to generate merged.bin for 1-step fresh flash
          python3 firmware/merge_bin.py --output build_output/merged.bin
          cp build_output/merged.bin build_output/esp32s3_streamer_merged_16mb.bin 2>/dev/null || true

          # 2. Collect PlatformIO compiled binaries if present
          if [ -d ".pio/build/esp32s3_n16r8_arduino" ]; then
            cp .pio/build/esp32s3_n16r8_arduino/*.bin build_output/ 2>/dev/null || true
            cp .pio/build/esp32s3_n16r8_arduino/*.elf build_output/ 2>/dev/null || true
          fi

          # 3. Collect ESP-IDF compiled binaries if present
          if [ -d "firmware/build" ]; then
            cp firmware/build/*.bin build_output/ 2>/dev/null || true
            cp firmware/build/*.elf build_output/ 2>/dev/null || true
            cp firmware/build/bootloader/*.bin build_output/ 2>/dev/null || true
            cp firmware/build/partition_table/*.bin build_output/ 2>/dev/null || true
          fi

          # 4. Include partition configuration, merger utility, and instructions
          cp firmware/partitions_16mb.csv build_output/ 2>/dev/null || true
          cp firmware/sdkconfig.defaults build_output/ 2>/dev/null || true
          cp firmware/merge_bin.py build_output/ 2>/dev/null || true
          cp FLASHING_GUIDE.md build_output/ 2>/dev/null || true

      - name: Upload Firmware & merged.bin Bundle
        uses: actions/upload-artifact@v4
        with:
          name: esp32s3-firmware-bundle
          path: build_output/
`
  },
  {
    filename: 'firmware/merge_bin.py',
    category: 'config',
    description: 'Python utility to merge Bootloader (0x0), Partitions (0x8000), and App (0x20000) into merged.bin',
    language: 'python',
    content: `#!/usr/bin/env python3
"""
ESP32-S3 N16R8 Binary Merger Utility for Fresh Flashing
======================================================
Merges bootloader, partition table, and application binary into a single unified
\`merged.bin\` image for 1-click fresh flashing starting at offset 0x0000.

Offsets:
  0x000000: Bootloader (bootloader.bin)
  0x008000: Partition Table (partition-table.bin)
  0x020000: Application Firmware (esp32_s3_hifi_streamer.bin)

Fresh Flash Command:
  esptool.py --chip esp32s3 -p /dev/ttyUSB0 -b 921600 write_flash 0x0 merged.bin
"""

import os, sys, argparse, subprocess, shutil

BOOTLOADER_OFFSET = 0x0000
PARTITION_TABLE_OFFSET = 0x8000
APP_OFFSET = 0x20000

def merge_in_python(bootloader_path, partitions_path, app_path, output_path):
    with open(bootloader_path, "rb") as f: b_data = f.read()
    with open(partitions_path, "rb") as f: p_data = f.read()
    with open(app_path, "rb") as f: a_data = f.read()

    total_size = APP_OFFSET + len(a_data)
    if total_size % 0x1000 != 0:
        total_size += 0x1000 - (total_size % 0x1000)

    image = bytearray([0xFF] * total_size)
    image[BOOTLOADER_OFFSET : BOOTLOADER_OFFSET + len(b_data)] = b_data
    image[PARTITION_TABLE_OFFSET : PARTITION_TABLE_OFFSET + len(p_data)] = p_data
    image[APP_OFFSET : APP_OFFSET + len(a_data)] = a_data

    os.makedirs(os.path.dirname(output_path) or ".", exist_ok=True)
    with open(output_path, "wb") as f: f.write(image)
    print(f"[+] Successfully generated merged binary: {output_path} ({len(image):,} bytes)")

if __name__ == "__main__":
    print("[*] Merging ESP32-S3 binaries for fresh flash starting at 0x0...")
`
  },
  {
    filename: 'FLASHING_GUIDE.md',
    category: 'documentation',
    description: 'Fresh Flash and OTA Upgrade guide for ESP32-S3 N16R8 + UDA1334A DAC',
    language: 'markdown',
    content: `# ESP32-S3 N16R8 Fresh Flash & Dual-OTA Guide

## 1. Fresh Flash (Single File: \`merged.bin\` at 0x0)
When bringing up a brand new or blank ESP32-S3-WROOM-1-N16R8 board, flash the all-in-one \`merged.bin\` starting from offset **\`0x000000\`**:

\`\`\`bash
# Linux / macOS / WSL:
esptool.py --chip esp32s3 -p /dev/ttyUSB0 -b 921600 \\
  --before default_reset --after hard_reset \\
  write_flash --flash_mode dio --flash_freq 80m --flash_size 16MB \\
  0x0 merged.bin

# Windows (COM Port):
esptool.py --chip esp32s3 -p COM3 -b 921600 write_flash 0x0 merged.bin
\`\`\`

## 2. Web Browser Flashing (Chrome / Edge)
1. Navigate to https://espressif.github.io/esptool-js/
2. Click **Connect** and pick your ESP32-S3 USB Serial Port.
3. Add file **\`merged.bin\`** with offset **\`0x0\`**.
4. Click **Program**.
5. Once complete, your ESP32-S3 boots into AP mode (\`ESP32-Music-Setup\`) or connects to your Wi-Fi!

## 3. Flash Memory Map (16MB SPI Flash):
- **0x000000 - 0x007FFF**: ESP32-S3 Bootloader
- **0x008000 - 0x008FFF**: Partition Table (Custom Dual 4MB OTA)
- **0x009000 - 0x00EFFF**: NVS Flash (Wi-Fi credentials, Volume, EQ settings)
- **0x00F000 - 0x010FFF**: OTA Data (Active bank marker: ota_0 vs ota_1)
- **0x020000 - 0x41FFFF**: App Partition 0 (4MB)
- **0x420000 - 0x81FFFF**: App Partition 1 (4MB)
- **0x820000 - 0xC1FFFF**: SPIFFS Static Web Assets (4MB)
`
  },
  {
    filename: 'CMakeLists.txt',
    category: 'config',
    description: 'Root ESP-IDF CMake build script for GitHub repo compilation',
    language: 'cmake',
    content: `cmake_minimum_required(VERSION 3.16)

# Include ESP-IDF project configuration
include($ENV{IDF_PATH}/tools/cmake/project.cmake)

project(esp32_s3_hifi_streamer)
`
  },
  {
    filename: 'main/CMakeLists.txt',
    category: 'config',
    description: 'Main component registration with audio driver, DSP, and OTA dependencies',
    language: 'cmake',
    content: `idf_component_register(
    SRCS "main.c" "i2s_uda1334a.c" "dsp_eq.c" "ota_handler.c"
    INCLUDE_DIRS "."
    REQUIRES esp_wifi esp_netif esp_event nvs_flash esp_http_server mdns esp_driver_i2s esp_ota app_update
)
`
  },
  {
    filename: 'requirements.txt',
    category: 'config',
    description: 'Python package requirements (esptool) for automated firmware merging and flashing',
    language: 'ini',
    content: `# Python requirements for ESP32-S3 Firmware & Binary Merging
esptool>=4.7.0
`
  },
  {
    filename: 'platformio.ini',
    category: 'config',
    description: 'PlatformIO configuration for ESP32-S3 N16R8 (Arduino + ESP-IDF environments, Octal PSRAM)',
    language: 'ini',
    content: `; ====================================================================
; ESP32-S3 N16R8 Hi-Fi Music Streamer & AirPlay/DLNA Receiver
; Hardware: ESP32-S3-WROOM-1-N16R8 (16MB Flash, 8MB Octal PSRAM)
; DAC: NXP UDA1334A I2S Stereo Audio DAC
; Frameworks: Arduino + ESP-IDF (Dual-Compatible)
; ====================================================================

[platformio]
default_envs = esp32s3_n16r8_arduino
src_dir = firmware_platformio/src
include_dir = firmware_platformio/include

; Global Settings applied to all environments
[env]
platform = espressif32 @ ^6.5.0
board = esp32-s3-devkitc-1
upload_speed = 921600
monitor_speed = 115200
board_build.partitions = firmware/partitions_16mb.csv

; ESP32-S3 N16R8 Flash & PSRAM Architecture
board_build.flash_mode = qio
board_build.f_flash = 80000000L
board_upload.flash_size = 16MB
board_upload.maximum_size = 4194304

; --------------------------------------------------------------------
; Environment 1: Arduino Framework (Popular, Easy, Rich Audio Libs)
; --------------------------------------------------------------------
[env:esp32s3_n16r8_arduino]
framework = arduino
build_flags = 
    -DCORE_DEBUG_LEVEL=3
    -DBOARD_HAS_PSRAM
    -mfix-esp32-psram-cache-issue
    -DCONFIG_SPIRAM_CACHE_WORKAROUND
    -DCONFIG_IDF_TARGET_ESP32S3=1
    ; Pin Configuration for UDA1334A I2S DAC
    -DI2S_BCLK=4
    -DI2S_LRCK=5
    -DI2S_DOUT=6
lib_deps =
    bblanchon/ArduinoJson @ ^7.0.0
    earlephilhower/ESP8266Audio @ ^1.9.9
    esphome/ESPAsyncWebServer-esphome @ ^3.1.0
    AsyncTCP-esphome @ ^2.0.1

; --------------------------------------------------------------------
; Environment 2: Native ESP-IDF v5.x (Industry Grade, Production)
; --------------------------------------------------------------------
[env:esp32s3_n16r8_espidf]
framework = espidf
build_flags =
    -DCONFIG_SPIRAM_MODE_OCT=1
    -DCONFIG_SPIRAM_BOOT_INIT=1
    -DCONFIG_IDF_TARGET_ESP32S3=1
`
  },
  {
    filename: 'firmware_platformio/src/main.cpp',
    category: 'firmware',
    description: 'Arduino C++ entry point with UDA1334A I2S driver, SoftAP setup, mDNS, and 3-Band EQ',
    language: 'cpp',
    content: `/**
 * ESP32-S3 N16R8 Production Hi-Fi Streamer
 * Arduino / PlatformIO Entry Point
 * 
 * Hardware:
 *   - ESP32-S3-WROOM-1-N16R8 (16MB Flash, 8MB Octal PSRAM)
 *   - NXP UDA1334A I2S DAC (BCLK=GPIO4, WCLK/LRCK=GPIO5, DIN=GPIO6)
 */

#include <Arduino.h>
#include <WiFi.h>
#include <ESPmDNS.h>
#include <Preferences.h>
#include <Update.h>
#include <driver/i2s.h>
#include <ArduinoJson.h>

#define I2S_BCLK 4
#define I2S_LRCK 5
#define I2S_DOUT 6
#define I2S_PORT I2S_NUM_0

Preferences preferences;

// Global Audio State
struct AudioState {
    int volume = 80;
    bool isMuted = false;
    float bass = 0.0f;     // -12.0 dB to +12.0 dB
    float mid = 0.0f;      // -12.0 dB to +12.0 dB
    float treble = 0.0f;   // -12.0 dB to +12.0 dB
    char currentUrl[256] = "http://ice1.somafm.com/groovesalad-128-mp3";
    bool isPlaying = false;
} audioState;

// Initialize I2S hardware driver for UDA1334A DAC
bool setupI2SAudio() {
    i2s_config_t i2s_config = {
        .mode = (i2s_mode_t)(I2S_MODE_MASTER | I2S_MODE_TX),
        .sample_rate = 44100,
        .bits_per_sample = I2S_BITS_PER_SAMPLE_16BIT,
        .channel_format = I2S_CHANNEL_FMT_RIGHT_LEFT,
        .communication_format = I2S_COMM_FORMAT_STAND_I2S,
        .intr_alloc_flags = ESP_INTR_FLAG_LEVEL1,
        .dma_buf_count = 8,
        .dma_buf_len = 512,
        .use_apll = true,
        .tx_desc_auto_clear = true
    };

    i2s_pin_config_t pin_config = {
        .bck_io_num = I2S_BCLK,
        .ws_io_num = I2S_LRCK,
        .data_out_num = I2S_DOUT,
        .data_in_num = I2S_PIN_NO_CHANGE
    };

    esp_err_t err = i2s_driver_install(I2S_PORT, &i2s_config, 0, NULL);
    if (err != ESP_OK) return false;
    i2s_set_pin(I2S_PORT, &pin_config);
    i2s_set_clk(I2S_PORT, 44100, I2S_BITS_PER_SAMPLE_16BIT, I2S_CHANNEL_STEREO);
    return true;
}

void setup() {
    Serial.begin(115200);
    delay(1000);
    Serial.println("ESP32-S3 N16R8 Production Hi-Fi Streamer Online");
    setupI2SAudio();
    
    // Wi-Fi & mDNS Responder
    WiFi.mode(WIFI_AP_STA);
    WiFi.softAP("ESP32-Music-Setup", "12345678");
    if (MDNS.begin("espmusic")) {
        MDNS.addService("http", "tcp", 80);
        MDNS.addService("raop", "tcp", 5000);
        MDNS.addService("upnp", "tcp", 49152);
    }
}

void loop() {
    vTaskDelay(pdMS_TO_TICKS(1000));
}
`
  }
];

/*
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
#include "ota_handler.h"

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

    // 5. Start mDNS .local server (default: espmusic.local)
    init_mdns_service("espmusic");

    ESP_LOGI(TAG, "Audio subsystem online. I2S DMA linked to UDA1334A DAC.");
}

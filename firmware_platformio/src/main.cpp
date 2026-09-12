#include <Arduino.h>
#include <WiFi.h>
#include <AsyncTCP.h>
#include <ESPAsyncWebServer.h>
#include <ArduinoJson.h>
#include <driver/i2s.h>
#include <esp_dsp.h>
#include <nvs_flash.h>

// UDA1334A I2S Pin Mapping (ESP32-S3)
#ifndef I2S_BCLK
#define I2S_BCLK 4
#endif
#ifndef I2S_WCLK
#define I2S_WCLK 5
#endif
#ifndef I2S_DOUT
#define I2S_DOUT 6
#endif

AsyncWebServer server(80);

void initI2S() {
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
        .tx_desc_auto_clear = true,
        .fixed_mclk = 0
    };

    i2s_pin_config_t pin_config = {
        .bck_io_num = I2S_BCLK,
        .ws_io_num = I2S_WCLK,
        .data_out_num = I2S_DOUT,
        .data_in_num = I2S_PIN_NO_CHANGE
    };

    esp_err_t err = i2s_driver_install(I2S_NUM_0, &i2s_config, 0, NULL);
    if (err == ESP_OK) {
        i2s_set_pin(I2S_NUM_0, &pin_config);
        i2s_zero_dma_buffer(I2S_NUM_0);
        Serial.println("[I2S] Driver installed successfully for UDA1334A");
    } else {
        Serial.printf("[I2S] Installation error: 0x%x\n", err);
    }
}

void setup() {
    Serial.begin(115200);
    delay(1000);

    Serial.println("=============================================");
    Serial.println(" ESP32-S3 N16R8 High-Res WebStream Node");
    Serial.println(" Hardware: N16R8 + UDA1334A I2S DAC");
    Serial.println("=============================================");

    // Initialize NVS
    esp_err_t ret = nvs_flash_init();
    if (ret == ESP_ERR_NVS_NO_FREE_PAGES || ret == ESP_ERR_NVS_NEW_VERSION_FOUND) {
        ESP_ERROR_CHECK(nvs_flash_erase());
        ret = nvs_flash_init();
    }

    // Check PSRAM
    if (psramFound()) {
        Serial.printf("[PSRAM] Octal PSRAM initialized! Total: %u bytes, Free: %u bytes\n", 
                      ESP.getPsramSize(), ESP.getFreePsram());
    } else {
        Serial.println("[PSRAM] WARNING: Octal PSRAM not detected!");
    }

    // Initialize I2S Hardware
    initI2S();

    // Start WiFi AP mode fallback if not configured
    WiFi.mode(WIFI_AP_STA);
    WiFi.softAP("ESP32S3-HiFi-Audio", "12345678");
    Serial.print("[WiFi] AP Mode active: SSID 'ESP32S3-HiFi-Audio', IP: ");
    Serial.println(WiFi.softAPIP());

    // REST API Endpoints
    server.on("/api/telemetry", HTTP_GET, [](AsyncWebServerRequest *request) {
        JsonDocument doc;
        doc["cpu_mhz"] = getCpuFrequencyMhz();
        doc["free_heap"] = ESP.getFreeHeap();
        doc["total_psram"] = ESP.getPsramSize();
        doc["free_psram"] = ESP.getFreePsram();
        doc["sample_rate"] = 44100;
        doc["bit_depth"] = 16;
        doc["channels"] = 2;
        doc["chip"] = "ESP32-S3 N16R8";
        doc["dac"] = "UDA1334A I2S";
        String response;
        serializeJson(doc, response);
        request->send(200, "application/json", response);
    });

    server.begin();
    Serial.println("[HTTP] Web Server active on port 80");
}

void loop() {
    vTaskDelay(pdMS_TO_TICKS(100));
}

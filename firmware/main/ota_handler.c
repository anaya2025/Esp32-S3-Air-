#include "ota_handler.h"
#include "esp_ota_ops.h"
#include "esp_log.h"
#include "esp_system.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"

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

    ESP_LOGI(TAG, "Target OTA partition: %s (offset 0x%08" PRIx32 ", size %" PRIu32 " KB)", 
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

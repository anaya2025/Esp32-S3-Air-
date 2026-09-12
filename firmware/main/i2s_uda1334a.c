#include "i2s_uda1334a.h"
#include "esp_log.h"
#include "driver/i2s_std.h"

static const char *TAG = "I2S_UDA1334A";
static i2s_chan_handle_t tx_chan = NULL;

esp_err_t i2s_uda1334a_init(const uda1334a_config_t *config) {
    ESP_LOGI(TAG, "Initializing UDA1334A DAC: BCLK=%d, WCLK=%d, DOUT=%d",
             config->bclk_io_num, config->wclk_io_num, config->din_io_num);

    i2s_chan_config_t chan_cfg = I2S_CHANNEL_DEFAULT_CONFIG(I2S_NUM_0, I2S_ROLE_MASTER);
    chan_cfg.dma_desc_num = config->dma_desc_num;
    chan_cfg.dma_frame_num = config->dma_frame_num;
    chan_cfg.auto_clear = true;

    ESP_ERROR_CHECK(i2s_new_channel(&chan_cfg, &tx_chan, NULL));

    i2s_std_config_t std_cfg = {
        .clk_cfg = I2S_STD_CLK_DEFAULT_CONFIG(config->sample_rate),
        .slot_cfg = I2S_STD_PHILIPS_SLOT_DEFAULT_CONFIG(config->bit_depth, I2S_SLOT_MODE_STEREO),
        .gpio_cfg = {
            .mclk = I2S_GPIO_UNUSED,
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

    ESP_LOGI(TAG, "UDA1334A I2S driver active at %" PRIu32 " Hz", config->sample_rate);
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

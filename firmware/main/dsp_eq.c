#include "dsp_eq.h"
#include <math.h>
#include <string.h>

#define PI 3.14159265358979323846f

typedef struct {
    float b0, b1, b2, a1, a2;
    float x1_l, x2_l, y1_l, y2_l;
    float x1_r, x2_r, y1_r, y2_r;
} biquad_filter_t;

static biquad_filter_t filter_bass;
static biquad_filter_t filter_mid;
static biquad_filter_t filter_treble;
static float g_sample_rate = 44100.0f;

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
    f->b2 = (A * ((A + 1.0f) - (A - 1.0f) * cos_w0 - two_sqrt_A_alpha)) / a0;
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

        // Soft clip guard
        if (out_l > 32767.0f) out_l = 32767.0f;
        else if (out_l < -32768.0f) out_l = -32768.0f;
        if (out_r > 32767.0f) out_r = 32767.0f;
        else if (out_r < -32768.0f) out_r = -32768.0f;

        samples[i] = (int16_t)out_l;
        samples[i + 1] = (int16_t)out_r;
    }
}

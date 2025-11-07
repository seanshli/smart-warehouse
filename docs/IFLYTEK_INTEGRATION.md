# iFLYTEK (科大訊飛) 語音識別整合

## 概述

本系統已整合 iFLYTEK 語音識別（ASR）服務作為主要引擎，並以 OpenAI Whisper 作為備選方案。

## 配置

### 環境變數

在 `.env.local` 文件中添加以下配置：

```env
# iFLYTEK (科大訊飛) API Configuration
IFLYTEK_APP_KEY="4ba58cf3dc03c31f7262b183a5b1f575"
IFLYTEK_APP_SECRET="OGE5N2MxYzIzNGY4NzE0MTVhOTNkMmU0"
IFLYTEK_VERIFY_TOKEN="e1fd74d5b0f7c9f8"
IFLYTEK_AES_KEY="26a6a47e69471bb8"
```

### 認證信息

- **AppKey**: 應用標識符
- **AppSecret**: 應用密鑰
- **Verify Token**: 校驗令牌
- **AES Key**: 加密密鑰

## 工作流程

1. **主要引擎**: 系統首先嘗試使用 iFLYTEK 進行語音轉文字
2. **備選引擎**: 如果 iFLYTEK 失敗或返回空結果，自動切換到 OpenAI Whisper
3. **錯誤處理**: 如果兩個引擎都失敗，系統會記錄錯誤但不會中斷應用流程

## API 端點

- **ASR API**: `https://iat-api.xfyun.cn/v2/iat` (語音識別)
- **TTS API**: `https://tts-api.xfyun.cn/v2/tts` (文字轉語音，預留)

## 語言支持

系統自動將語言代碼映射到 iFLYTEK 格式：

- `zh`, `zh-TW`, `zh-CN` → `zh_cn` (中文)
- `en` → `en_us` (英文)
- `ja` → `ja_jp` (日文)

## 使用示例

```typescript
import { transcribeAudioFormData } from '@/lib/speech-to-text'

// 自動使用 iFLYTEK (主要) 或 OpenAI (備選)
const transcript = await transcribeAudioFormData(audioBase64, 'zh')
```

## 響應格式

iFLYTEK 返回格式：
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "result": {
      "ws": [
        {
          "cw": [
            {
              "w": "識別的文字"
            }
          ]
        }
      ]
    }
  }
}
```

## 注意事項

1. **音頻格式**: 系統支持 WebM/Opus 格式，iFLYTEK 會自動處理格式轉換
2. **認證**: 使用 MD5 校驗和進行 API 認證
3. **超時**: VAD (Voice Activity Detection) 超時設置為 10 秒
4. **錯誤處理**: 所有錯誤都會被記錄，但不會中斷應用流程

## 調試

查看服務器日誌以了解轉錄過程：
- `Attempting transcription with iFLYTEK...`
- `✓ iFLYTEK transcription successful`
- `iFLYTEK transcription failed or empty, falling back to OpenAI...`
- `✓ OpenAI transcription successful (fallback)`

## 未來擴展

- [ ] 實現 WebSocket 實時語音識別
- [ ] 添加文字轉語音 (TTS) 功能
- [ ] 支持更多音頻格式
- [ ] 添加語音識別質量評分


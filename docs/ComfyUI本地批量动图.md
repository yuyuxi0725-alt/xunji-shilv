# ComfyUI 本地批量动图

## 本机配置

- ComfyUI：`D:\AI\ComfyUI`
- 启动器：`D:\AI\ComfyUI\run_nvidia_gpu.bat`
- API：`http://127.0.0.1:8188`
- 显卡：NVIDIA GeForce RTX 4060 Laptop GPU，8GB 显存
- 工作流：Wan 2.1 Fun Inpaint 1.3B（图生视频）

模型放置目录：

```text
D:\AI\ComfyUI\ComfyUI\models\
├─ diffusion_models\wan2.1_fun_inp_1.3B_bf16.safetensors
├─ text_encoders\umt5_xxl_fp8_e4m3fn_scaled.safetensors
├─ clip_vision\clip_vision_h.safetensors
└─ vae\wan_2.1_vae.safetensors
```

## 使用方法

先双击 ComfyUI 启动器，等控制台出现：

```text
To see the GUI go to: http://127.0.0.1:8188
```

列出可以生成的时期：

```powershell
python tools\comfyui-batch-gif.py --list
```

先生成一个低成本样片：

```powershell
python tools\comfyui-batch-gif.py --period dufu-p1-young
```

指定多个时期：

```powershell
python tools\comfyui-batch-gif.py `
  --period dufu-p2-mid `
  --period libai-p1-young `
  --period sushi-p1-young
```

所有单个样片验收后，才建议执行全量任务：

```powershell
python tools\comfyui-batch-gif.py --all
```

结果保存在：

```text
output\comfyui-gif\
```

每个时期会产生一个 ComfyUI 视频和一个透明背景 GIF。批处理脚本不会自动覆盖
`_cloud_upload/assets/images/npc` 中的正式素材。

## 8GB 显存默认参数

```text
生成尺寸：384 × 576
帧数：33
采样步数：12
帧率：12 fps
```

这些参数优先保证能够在 8GB 显存上运行。确认首个样片稳定后，再考虑增加帧数或
采样步数；不建议直接提升到 720p。

时期提示词配置位于 `tools/comfyui-periods.json`。需要调整某一时期的动作时，优先
修改对应的 `prompt`，保持“微弱呼吸、眨眼、衣摆轻动、固定镜头、保持人物身份”这类
小幅度描述。

## 原图清晰度优先流程（正式素材使用）

不要把 Wan 输出的低分辨率视频直接转换成正式 GIF。Wan 只负责提供“动作参考”，
最终画面由原始 768×1152 透明 PNG 的像素重新映射，脸、眼睛、衣纹不会被模型重画。

已导入的工作流名称：

```text
寻迹古今-动作参考-Wan1.3B
```

工作流使用 384×576、17 帧、20 步生成动作参考。这一分辨率不会成为最终成品分辨率。
工作流中只需要修改三个地方：两个 `LoadImage` 选择同一张人物图，以及正向提示词中的
局部动作。不要写走路、转身、大幅抬手等会改变轮廓的大动作。

拿到 ComfyUI 输出的 MP4 后，执行：

```powershell
python tools\native-character-animation.py `
  --period dufu-p1-young `
  --reference "D:\AI\ComfyUI\ComfyUI\output\xunji-motion\character-motion-reference_00001.mp4"
```

结果保存在 `output\native-character-animation\`：

- `*-native.png`：透明 APNG，原始尺寸、全彩、无损，正式素材首选。
- `*-native.webp`：透明动态 WebP，原始尺寸、无损。
- `*-native.gif`：原始尺寸透明 GIF；尺寸不缩小，但受 GIF 256 色限制。

没有 MP4 时，可先验证本地无损合成器：

```powershell
python tools\native-character-animation.py --period dufu-p1-young --procedural
```

推荐动作强度范围为 `0.35` 到 `0.80`。眼睛必须绝对清晰时保持默认
`--face-lock 1.0`；该设置会完全锁住头部原始像素。若出现衣袖移动过大，使用
`--strength 0.45 --max-motion 6`。

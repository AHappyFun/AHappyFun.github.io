# =============================================================
# 云分类文章 - 图片下载脚本
# 将本脚本放在 source/_posts/Art-云的分类/ 目录下运行
# =============================================================

$targetDir = Split-Path -Parent $MyInvocation.MyCommand.Path
if (-not $targetDir) { $targetDir = Get-Location }

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  云分类文章配图下载脚本" -ForegroundColor Cyan
Write-Host "  目标目录: $targetDir" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
$success = 0
$skipped = 0
$failed = 0

# =============================================================
# PART 1: 10 种云属照片 (Pexels 免费图库)
# =============================================================
Write-Host "[1/2] 下载十大云属照片..." -ForegroundColor Yellow
Write-Host "来源: Pexels.com (免费商用, 无需署名)"
Write-Host ""

$cloudPhotos = @(
    @{url="https://images.pexels.com/photos/3940880/pexels-photo-3940880.jpeg?w=1200&q=80"; file="cirrus-fibratus.jpg"; desc="卷云 Cirrus"},
    @{url="https://images.pexels.com/photos/584414/fluffy-cloud-cloudscape-sky-584414.jpeg?w=1200&q=80"; file="cirrocumulus-stratiformis.jpg"; desc="卷积云 Cirrocumulus"},
    @{url="https://images.pexels.com/photos/10731756/pexels-photo-10731756.jpeg?w=1200&q=80"; file="cirrostratus-halo.jpg"; desc="卷层云 Cirrostratus (日晕)"},
    @{url="https://images.pexels.com/photos/14644830/pexels-photo-14644830.jpeg?w=1200&q=80"; file="altocumulus-stratiformis.jpg"; desc="高积云 Altocumulus"},
    @{url="https://images.pexels.com/photos/8396149/pexels-photo-8396149.jpeg?w=1200&q=80"; file="altostratus.jpg"; desc="高层云 Altostratus"},
    @{url="https://images.pexels.com/photos/10754631/pexels-photo-10754631.jpeg?w=1200&q=80"; file="stratocumulus.jpg"; desc="层积云 Stratocumulus"},
    @{url="https://images.pexels.com/photos/5940014/pexels-photo-5940014.jpeg?w=1200&q=80"; file="stratus.jpg"; desc="层云 Stratus"},
    @{url="https://images.pexels.com/photos/479507/pexels-photo-479507.jpeg?w=1200&q=80"; file="cumulus-humilis.jpg"; desc="淡积云 Cumulus humilis"},
    @{url="https://images.pexels.com/photos/30067997/pexels-photo-30067997.jpeg?w=1200&q=80"; file="cumulus-congestus.jpg"; desc="浓积云 Cumulus congestus"},
    @{url="https://images.pexels.com/photos/9198152/pexels-photo-9198152.jpeg?w=1200&q=80"; file="cumulonimbus-incus.jpg"; desc="积雨云 Cumulonimbus"}
)

$total = $cloudPhotos.Count
$i = 0
foreach ($photo in $cloudPhotos) {
    $i++
    $localPath = Join-Path $targetDir $photo.file

    # Skip if already downloaded and valid (>10KB)
    if (Test-Path $localPath) {
        $existingSize = (Get-Item $localPath).Length
        if ($existingSize -gt 10240) {
            Write-Host "  [$i/$total] $($photo.desc) - 已存在, 跳过" -ForegroundColor Gray
            $skipped++
            continue
        }
    }

    Write-Host "  [$i/$total] $($photo.desc)..." -NoNewline
    try {
        Invoke-WebRequest -Uri $photo.url -OutFile $localPath -UserAgent $ua -TimeoutSec 30
        $size = [math]::Round((Get-Item $localPath).Length / 1024)
        Write-Host " OK ($size KB)" -ForegroundColor Green
        $success++
    } catch {
        Write-Host " FAIL: $($_.Exception.Message)" -ForegroundColor Red
        $failed++
    }
    Start-Sleep -Milliseconds 500
}

# =============================================================
# PART 2: 历史图片 (Science Museum Group)
# =============================================================
Write-Host ""
Write-Host "[2/2] 下载历史图片..." -ForegroundColor Yellow
Write-Host "来源: Science Museum Group Collection (CC BY-NC-SA)"
Write-Host ""

$historyPhotos = @(
    @{url="https://coimages.sciencemuseumgroup.org.uk/671/445/large_smg00007737.jpg"; file="howard-cloud-sketches.jpg"; desc="Howard: 积云手绘原稿"},
    @{url="https://coimages.sciencemuseumgroup.org.uk/63/587/large_1981_0862_0042.jpg"; file="international-cloud-atlas-1896.jpg"; desc="Howard: 大风中的积云"}
)

foreach ($hp in $historyPhotos) {
    $localPath = Join-Path $targetDir $hp.file
    if (Test-Path $localPath -and (Get-Item $localPath).Length -gt 10240) {
        Write-Host "  $($hp.desc) - 已存在, 跳过" -ForegroundColor Gray
        $skipped++
        continue
    }
    Write-Host "  $($hp.desc)..." -NoNewline
    try {
        Invoke-WebRequest -Uri $hp.url -OutFile $localPath -UserAgent $ua -TimeoutSec 30
        $size = [math]::Round((Get-Item $localPath).Length / 1024)
        Write-Host " OK ($size KB)" -ForegroundColor Green
        $success++
    } catch {
        Write-Host " FAIL: $($_.Exception.Message)" -ForegroundColor Red
        $failed++
    }
    Start-Sleep -Seconds 1
}

# =============================================================
# SUMMARY
# =============================================================
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  全部完成! 成功: $success  跳过: $skipped  失败: $failed" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# List all image files
$allImages = Get-ChildItem $targetDir | Where-Object { $_.Extension -match '\.(jpg|jpeg|png|svg)$' } | Sort-Object Name
Write-Host "当前所有图片文件:" -ForegroundColor Yellow
foreach ($img in $allImages) {
    $kb = [math]::Round($img.Length / 1024)
    $icon = if ($kb -gt 10) { "[OK]" } else { "[SMALL]" }
    $color = if ($kb -gt 10) { "Green" } else { "Yellow" }
    Write-Host "  $icon $($img.Name.PadRight(42)) $($kb.ToString().PadLeft(6)) KB" -ForegroundColor $color
}

if ($failed -gt 0) {
    Write-Host ""
    Write-Host "部分图片下载失败, 可手动从以下来源获取:" -ForegroundColor Yellow
    Write-Host "  1. Pexels: https://www.pexels.com (搜索对应云类型)" -ForegroundColor White
    Write-Host "  2. WMO 云图集: https://cloudatlas.wmo.int/" -ForegroundColor White
    Write-Host "  3. Wikimedia Commons: https://commons.wikimedia.org" -ForegroundColor White
}

Write-Host ""
Write-Host "按任意键退出..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

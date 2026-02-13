
Add-Type -AssemblyName System.Drawing
$inputFile = "$PSScriptRoot\assets\task_logo_final.png"
$outputFile = "$PSScriptRoot\assets\task_logo_final_real.png"

Write-Host "Converting $inputFile to $outputFile..."

try {
    $img = [System.Drawing.Image]::FromFile($inputFile)
    $img.Save($outputFile, [System.Drawing.Imaging.ImageFormat]::Png)
    $img.Dispose()
    Write-Host "Conversion successful."
} catch {
    Write-Error "Conversion failed: $_"
    exit 1
}

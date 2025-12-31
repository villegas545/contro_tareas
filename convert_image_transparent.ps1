
Add-Type -AssemblyName System.Drawing
$inputFile = "$PSScriptRoot\assets\task_logo_final.png"
$outputFile = "$PSScriptRoot\assets\task_logo_final_transparent_real.png"

Write-Host "Converting $inputFile to transparent PNG..."

try {
    # Load as Bitmap to access pixel manipulation methods
    $img = [System.Drawing.Bitmap]::FromFile($inputFile)
    
    # Make white transparent
    # Note: JPEG compression might make "white" not exactly (255,255,255). 
    # But strictly generated white background should be close.
    # MakeTransparent picks the exact color of the pixel at (0,0) or specified color.
    # Let's assume the top-left pixel is the background color.
    $bgColor = $img.GetPixel(0, 0)
    Write-Host "Detected background color: $bgColor"
    
    $img.MakeTransparent($bgColor)
    
    $img.Save($outputFile, [System.Drawing.Imaging.ImageFormat]::Png)
    $img.Dispose()
    Write-Host "Conversion and transparency application successful."
} catch {
    Write-Error "Failed: $_"
    exit 1
}

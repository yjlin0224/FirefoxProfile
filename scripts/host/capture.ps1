param([double]$cssX, [double]$cssY, [int]$cssW, [int]$cssH, [double]$dpr, [string]$out)
Add-Type -AssemblyName System.Drawing
Add-Type -TypeDefinition 'using System; using System.Runtime.InteropServices; public static class Dpi { [DllImport("user32.dll")] public static extern bool SetProcessDPIAware(); }'
[Dpi]::SetProcessDPIAware() | Out-Null
$x = [int]($cssX * $dpr); $y = [int]($cssY * $dpr); $w = [int]($cssW * $dpr); $h = [int]($cssH * $dpr)
$bmp = New-Object System.Drawing.Bitmap $w, $h
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.CopyFromScreen($x, $y, 0, 0, $bmp.Size)
$bmp.Save($out, [System.Drawing.Imaging.ImageFormat]::Png); $g.Dispose(); $bmp.Dispose()
"saved $out ($w x $h from $x,$y)"

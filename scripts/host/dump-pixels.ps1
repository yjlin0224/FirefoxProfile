param([string]$path, [int]$originX, [int]$originY)
Add-Type -AssemblyName System.Drawing
$b = [System.Drawing.Bitmap]::FromFile($path)
"cols: " + (($originX..($originX + $b.Width - 1)) | ForEach-Object { "{0,4}" -f ($_ % 10000) }) -join ""
for ($y = 0; $y -lt $b.Height; $y++) {
  $line = "{0,5} " -f ($originY + $y)
  for ($x = 0; $x -lt $b.Width; $x++) { $c = $b.GetPixel($x, $y); $l = [int](0.299*$c.R + 0.587*$c.G + 0.114*$c.B); $line += "{0,4}" -f $l }
  $line
}
$b.Dispose()

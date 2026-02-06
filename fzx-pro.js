/**
 * FZX Pro Library v3.0
 * The Professional Custom Code Generator & Scanner
 * Author: Mahim (Developed by AI Partner)
 * Supports: Generation, Scanning (Cam/File), Export (PNG, JPG, SVG, PDF)
 */

(function(global) {
    class FZXPro {
        constructor() {
            this.config = {
                w: 1000, h: 1200,
                dW: 16, dH: 7,
                gX: 10, gY: 15,
                zones: [
                    {l: "F", x: 50, y: 50, w: 80, h: 100},
                    {l: "Z", x: 870, y: 50, w: 80, h: 100},
                    {l: "X", x: 460, y: 1060, w: 80, h: 100},
                    {l: "FZX", x: 465, y: 545, w: 175, h: 110}
                ]
            };
            this.canvas = document.createElement('canvas');
            this.canvas.width = this.config.w;
            this.canvas.height = this.config.h;
            this.ctx = this.canvas.getContext('2d');
            this.lastData = "";
        }

        // --- 1. GENERATOR FUNCTION ---
        generate(containerId, text) {
            this.lastData = text;
            const ctx = this.ctx;
            
            // Background
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, this.config.w, this.config.h);

            // Binary Conversion (UTF-8)
            const bin = this._textToBin(text);
            let idx = 0;

            // Grid Logic
            for(let y=25; y < this.config.h-25; y+=this.config.dH+this.config.gY) {
                for(let x=25; x < this.config.w-25; x+=this.config.dW+this.config.gX) {
                    if(!this._checkCollision(x, y)) {
                        const bit = bin[idx % bin.length];
                        ctx.fillStyle = (bit === '1') ? "#000000" : "#e0e0e0";
                        this._roundRect(ctx, x, y, this.config.dW, this.config.dH, 3, true);
                        idx++;
                    }
                }
            }

            // Fixed Branding Zones
            this.config.zones.forEach(z => {
                ctx.strokeStyle = "#000"; ctx.lineWidth = 4; ctx.fillStyle = "#ffffff";
                this._roundRect(ctx, z.x, z.y, z.w, z.h, 12, true, true);
                ctx.fillStyle = "#000"; ctx.font = "bold 50px Arial";
                ctx.fillText(z.l, z.x + 20, z.y + 65);
            });

            // Show in Container
            const container = document.getElementById(containerId);
            if(container) {
                container.innerHTML = "";
                const img = new Image();
                img.src = this.canvas.toDataURL("image/png");
                img.style.maxWidth = "100%";
                img.style.boxShadow = "0 4px 8px rgba(0,0,0,0.1)";
                container.appendChild(img);
            }
        }

        // --- 2. DOWNLOAD FUNCTION (Multi-Format) ---
        download(filename = "fzx-code", format = "png") {
            const link = document.createElement('a');
            link.download = `${filename}.${format}`;

            if (format === 'png') {
                link.href = this.canvas.toDataURL("image/png");
                link.click();
            } else if (format === 'jpg' || format === 'jpeg') {
                link.href = this.canvas.toDataURL("image/jpeg", 0.9);
                link.click();
            } else if (format === 'svg') {
                const svgContent = this._generateSVG(this.lastData);
                const blob = new Blob([svgContent], {type: "image/svg+xml;charset=utf-8"});
                link.href = URL.createObjectURL(blob);
                link.click();
            } else if (format === 'pdf') {
                this._printPDF(); // Simple Print-to-PDF trigger
            }
        }

        // --- 3. SCANNER FUNCTION (Universal) ---
        async scan(source) {
            return new Promise((resolve, reject) => {
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = this.config.w; 
                tempCanvas.height = this.config.h;
                const tCtx = tempCanvas.getContext('2d');
                
                // If source is HTMLImageElement or VideoElement
                tCtx.drawImage(source, 0, 0, this.config.w, this.config.h);
                
                const px = tCtx.getImageData(0, 0, this.config.w, this.config.h).data;
                let bits = "";

                for(let y=25; y < this.config.h-25; y+=this.config.dH+this.config.gY) {
                    for(let x=25; x < this.config.w-25; x+=this.config.dW+this.config.gX) {
                        if(!this._checkCollision(x, y)) {
                            let mx = Math.floor(x + this.config.dW/2);
                            let my = Math.floor(y + this.config.dH/2);
                            let i = (my * this.config.w + mx) * 4;
                            // Check Red channel brightness
                            bits += (px[i] < 150) ? "1" : "0";
                        }
                    }
                }
                
                try {
                    const txt = this._binToText(bits);
                    resolve(txt);
                } catch(e) {
                    reject("Scanning Failed");
                }
            });
        }

        // --- INTERNAL HELPERS ---
        _textToBin(text) {
            const enc = new TextEncoder();
            const data = enc.encode(text + "<END>"); // Marker
            return Array.from(data).map(b => b.toString(2).padStart(8, '0')).join('');
        }

        _binToText(bin) {
            const bytes = [];
            for(let i=0; i<bin.length; i+=8) bytes.push(parseInt(bin.substr(i, 8), 2));
            const txt = new TextDecoder().decode(new Uint8Array(bytes));
            return txt.split("<END>")[0];
        }

        _checkCollision(x, y) {
            return this.config.zones.some(z => 
                x < z.x+z.w+10 && x+this.config.dW > z.x-10 && 
                y < z.y+z.h+10 && y+this.config.dH > z.y-10
            );
        }

        _roundRect(ctx, x, y, w, h, r, f, s) {
            ctx.beginPath(); ctx.roundRect(x, y, w, h, r);
            if(f) ctx.fill(); if(s) ctx.stroke();
        }

        _generateSVG(text) {
            // Manual SVG Construction for High Quality Vector
            let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${this.config.w}" height="${this.config.h}" viewBox="0 0 ${this.config.w} ${this.config.h}">`;
            svg += `<rect width="100%" height="100%" fill="#ffffff"/>`; // BG
            
            const bin = this._textToBin(text);
            let idx = 0;

            for(let y=25; y < this.config.h-25; y+=this.config.dH+this.config.gY) {
                for(let x=25; x < this.config.w-25; x+=this.config.dW+this.config.gX) {
                    if(!this._checkCollision(x, y)) {
                        const bit = bin[idx % bin.length];
                        const color = (bit === '1') ? "#000000" : "#e0e0e0";
                        svg += `<rect x="${x}" y="${y}" width="${this.config.dW}" height="${this.config.dH}" rx="3" fill="${color}"/>`;
                        idx++;
                    }
                }
            }
            
            this.config.zones.forEach(z => {
                svg += `<rect x="${z.x}" y="${z.y}" width="${z.w}" height="${z.h}" rx="12" fill="#ffffff" stroke="#000000" stroke-width="4"/>`;
                svg += `<text x="${z.x+z.w/2}" y="${z.y+z.h/2+15}" font-family="Arial" font-weight="bold" font-size="50" text-anchor="middle" fill="black">${z.l}</text>`;
            });

            svg += `</svg>`;
            return svg;
        }

        _printPDF() {
            const win = window.open('', '_blank');
            win.document.write(`<img src="${this.canvas.toDataURL()}" style="width:100%;"/>`);
            win.document.write(`<script>setTimeout(() => { window.print(); window.close(); }, 500);</script>`);
        }
    }

    // Expose to Window
    global.FZX = new FZXPro();

})(window);

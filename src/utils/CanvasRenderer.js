import MarkdownIt from 'markdown-it';

const md = new MarkdownIt({
    html: false,
    breaks: true,
    typographer: true
});

function parseMarkdownToAST(markdown) {
    const tokens = md.parse(markdown, {});
    const root = { type: 'root', children: [] };
    const stack = [root];

    const mapTokenType = (type) => {
        const map = {
            'strong': 'bold',
            'em': 'italic',
            'bullet_list': 'list',
            'list_item': 'listItem',
            'heading': 'heading',
            'paragraph': 'paragraph'
        };
        return map[type] || type;
    };

    const processToken = (token) => {
        if (token.type === 'inline') {
            token.children.forEach(processToken);
            return;
        }

        const current = stack[stack.length - 1];

        if (token.type === 'image') {
            // Images are usually inline but treated as blocks for our slide purpose
            current.children.push({
                type: 'image',
                src: token.attrs.find(attr => attr[0] === 'src')[1],
                alt: token.content
            });
            // Add a break after image
            current.children.push({ type: 'lineBreak' });
        } else if (token.type.endsWith('_open')) {
            const type = mapTokenType(token.type.replace('_open', ''));
            const node = { type, children: [] };
            if (type === 'heading') {
                node.level = parseInt(token.tag.slice(1));
            }
            current.children.push(node);
            stack.push(node);
        } else if (token.type.endsWith('_close')) {
            stack.pop();
        } else if (token.type === 'text') {
            current.children.push({ type: 'text', content: token.content });
        } else if (token.type === 'softbreak' || token.type === 'hardbreak') {
            current.children.push({ type: 'lineBreak' });
        }
    };

    tokens.forEach(processToken);
    return root;
}

export class CanvasMarkupRenderer {
    constructor(ctx, width, height, options = {}) {
        this.ctx = ctx;
        this.width = width;
        this.height = height;
        this.imageCache = options.imageCache || {}; // Map of src -> Image Object
        this.x = options.x || 60;
        this.y = options.y || 80;
        this.cursorX = this.x;
        this.cursorY = this.y;

        this.config = {
            defaultFontSize: options.fontSize || 36, // Balanced font size
            lineHeight: options.lineHeight || 52, // Balanced line height
            maxWidth: width - ((options.x || 60) * 2),
            listIndent: 50,
            colors: {
                text: '#000', // Slate-50 (White text) or black text
                background: '#fff' // Slate-900 (Dark background) or white background
            }
        };

        this.currentStyle = this.createDefaultStyle();
        this.currentListContext = null;
    }

    createDefaultStyle() {
        return {
            bold: false,
            italic: false,
            fontSize: this.config.defaultFontSize,
            fontFamily: "Inter, system-ui, sans-serif", // Modern font stack
            color: this.config.colors.text,
            superscript: false,
            subscript: false
        };
    }

    render(markup) {
        // 1. Sanitize the markup (remove LaTeX, fix symbols)
        const cleanMarkup = this.sanitizeText(markup);

        // Check if there is an image in the markup
        const hasImage = /!\[.*?\]\((.*?)\)/.test(cleanMarkup);

        // 2. Simple Heuristic for Auto-Scaling
        const textLength = cleanMarkup.length;
        let baseFontSize = 36;

        if (hasImage) {
            // Smaller font if sharing space with image
            if (textLength > 500) baseFontSize = 20;
            else if (textLength > 300) baseFontSize = 24;
            else if (textLength > 150) baseFontSize = 28;
            else baseFontSize = 32;
        } else {
            if (textLength > 1000) baseFontSize = 20;
            else if (textLength > 600) baseFontSize = 24;
            else if (textLength > 400) baseFontSize = 28;
            else if (textLength > 200) baseFontSize = 32;
        }

        this.config.defaultFontSize = baseFontSize;
        this.currentStyle = this.createDefaultStyle();

        this.ctx.fillStyle = this.config.colors.background;
        this.ctx.fillRect(0, 0, this.width, this.height);

        this.cursorX = this.x;
        this.cursorY = this.y + this.config.defaultFontSize;

        // Define layout areas
        if (hasImage) {
            this.layout = {
                text: { x: this.x, width: (this.width * 0.6) - this.x - 20 },
                image: { x: (this.width * 0.6) + 20, y: this.y, width: (this.width * 0.4) - 40, height: this.height - (this.y * 2) }
            };
            this.config.maxWidth = this.layout.text.width;
        } else {
            this.layout = {
                text: { x: this.x, width: this.width - (this.x * 2) },
                image: null
            };
            this.config.maxWidth = this.layout.text.width;
        }

        try {
            const ast = parseMarkdownToAST(cleanMarkup);
            this.renderNode(ast);
        } catch (error) {
            console.error("Markup rendering error:", error);
            this.renderText("Error rendering markup");
        }
    }

    renderNode(node) {
        const prevStyle = { ...this.currentStyle };
        const prevListContext = this.currentListContext ? { ...this.currentListContext } : null;

        // Apply styles based on node type
        switch (node.type) {
            case 'bold':
                this.currentStyle.bold = true;
                break;
            case 'italic':
                this.currentStyle.italic = true;
                break;
            case 'heading':
                this.currentStyle.bold = true;
                this.currentStyle.fontSize = this.config.defaultFontSize + (7 - node.level) * 8;

                // Only add a break if we are not at the top of the canvas
                // The initial cursorY is initialized to y + defaultFontSize
                if (this.cursorY > this.y + this.config.defaultFontSize + 20) {
                    this.addLineBreak();
                    this.cursorY += 10; // Add some extra spacing before headings if not at top
                } else {
                    // Even at top, if we changed font size significantly, we might want to adjust baseline?
                    // But usually baseline logic handles it.
                }
                break;
            case 'list':
                this.currentListContext = {
                    level: (this.currentListContext ? this.currentListContext.level : 0) + 1
                };
                this.addLineBreak();
                break;
            case 'listItem':
                this.addLineBreak();
                // Draw bullet
                const indent = this.config.listIndent * (this.currentListContext ? this.currentListContext.level : 1);
                this.ctx.font = `${this.currentStyle.fontSize}px ${this.currentStyle.fontFamily}`;
                this.ctx.fillStyle = this.config.colors.text; // Ensure bullet is visible
                this.ctx.fillText("•", this.x + indent - 20, this.cursorY);
                this.cursorX = this.x + indent;
                break;
            case 'paragraph':
                // Paragraphs usually start on a new line
                // BUT, if we are inside a list item and just drew a bullet, we should stay on the same line.
                // We check if we are at the "start" of the line (accounting for indentation).
                const expectedX = this.x + (this.currentListContext ? (this.config.listIndent * this.currentListContext.level) : 0);

                if (this.cursorX > expectedX + 5) {
                    this.addLineBreak();
                }
                break;
            case 'lineBreak':
                this.addLineBreak();
                break;
            case 'text':
                this.renderText(node.content);
                break;
            case 'image':
                this.renderImage(node.src);
                break;
        }

        // Render children
        if (node.children) {
            for (const child of node.children) {
                this.renderNode(child);
            }
        }

        // Cleanup after node (e.g. closing block elements)
        if (node.type === 'heading' || node.type === 'paragraph' || node.type === 'list' || node.type === 'listItem') {
            // Ensure we don't double break if the last child was a block, but generally blocks end with a break or visual separation
            // Logic kept simple: simple blocks might need a reset or specific spacing
        }

        // Restore state
        this.currentStyle = prevStyle;
        this.currentListContext = prevListContext;
    }

    sanitizeText(text) {
        if (!text) return "";
        let clean = text;

        // basic LaTeX cleanup
        clean = clean.replace(/\$\$/g, ''); // Remove double dollars
        clean = clean.replace(/\$/g, '');   // Remove single dollars
        clean = clean.replace(/\\frac\{([^}]*)\}\{([^}]*)\}/g, '($1/$2)'); // \frac{a}{b} -> (a/b)
        clean = clean.replace(/\\sqrt\{([^}]*)\}/g, '√($1)'); // \sqrt{x} -> √(x)
        clean = clean.replace(/\\cdot/g, '•');
        clean = clean.replace(/\\times/g, '×');
        clean = clean.replace(/\\pm/g, '±');
        clean = clean.replace(/\\approx/g, '≈');
        clean = clean.replace(/\\neq/g, '≠');
        clean = clean.replace(/\\le/g, '≤');
        clean = clean.replace(/\\ge/g, '≥');
        clean = clean.replace(/\\theta/g, 'θ');
        clean = clean.replace(/\\pi/g, 'π');
        clean = clean.replace(/\\alpha/g, 'α');
        clean = clean.replace(/\\beta/g, 'β');
        clean = clean.replace(/\\(\w+)/g, ''); // Remove other backslash commands

        // Superscript cleanup (basic x^2 -> x²)
        const superscripts = {
            '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
            '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
            '+': '⁺', '-': '⁻', '=': '⁼', '(': '⁽', ')': '⁾', 'n': 'ⁿ'
        };
        clean = clean.replace(/\^([0-9+\-=()n]+)/g, (match, p1) => {
            return p1.split('').map(c => superscripts[c] || c).join('');
        });

        // Handle ^{...} format
        clean = clean.replace(/\^\{([0-9+\-=()n]+)\}/g, (match, p1) => {
            return p1.split('').map(c => superscripts[c] || c).join('');
        });

        return clean;
    }

    renderText(text) {
        this.ctx.font = `${this.currentStyle.italic ? 'italic ' : ''}${this.currentStyle.bold ? 'bold ' : ''}${this.currentStyle.fontSize}px ${this.currentStyle.fontFamily}`;
        this.ctx.fillStyle = this.currentStyle.color;

        const words = text.split(' ');
        let line = '';

        for (let i = 0; i < words.length; i++) {
            const testLine = line + words[i] + ' ';
            const metrics = this.ctx.measureText(testLine);
            const testWidth = metrics.width;

            if (this.cursorX + testWidth > this.x + this.config.maxWidth && i > 0) {
                this.ctx.fillText(line, this.cursorX, this.cursorY);
                this.addLineBreak();
                line = words[i] + ' ';
            } else {
                line = testLine;
            }
        }

        this.ctx.fillText(line, this.cursorX, this.cursorY);
        const metrics = this.ctx.measureText(line);
        this.cursorX += metrics.width;
    }

    renderImage(src) {
        const img = this.imageCache[src];

        // If we are in split layout mode, use the defined image area
        const imageArea = this.layout.image;

        if (img && imageArea) {

            // "Contain" logic within the right column
            let drawWidth = img.width;
            let drawHeight = img.height;
            const containerW = imageArea.width;
            const containerH = imageArea.height;

            const scale = Math.min(containerW / drawWidth, containerH / drawHeight);

            drawWidth *= scale;
            drawHeight *= scale;

            // Center in the image area
            const x = imageArea.x + (containerW - drawWidth) / 2;
            const y = imageArea.y + (containerH - drawHeight) / 2;

            this.ctx.drawImage(img, x, y, drawWidth, drawHeight);

            // We don't advance cursorY for image in split mode as it's side-by-side
            // But we might want to ensure subsequent text doesn't overlap if we switch back?
            // For now, assuming image is the only thing in that column or it's fine.

        } else if (img) {
            // Fallback for full width if layout wasn't triggered
            this.cursorY += 20;

            const maxWidth = this.config.maxWidth;
            const maxHeight = this.height - this.cursorY - 50;

            let drawWidth = img.width;
            let drawHeight = img.height;

            if (drawWidth > maxWidth) {
                const scale = maxWidth / drawWidth;
                drawWidth = maxWidth;
                drawHeight = drawHeight * scale;
            }

            if (drawHeight > maxHeight) {
                const scale = maxHeight / drawHeight;
                drawHeight = maxHeight;
                drawWidth = drawWidth * scale;
            }

            const x = this.x + (this.config.maxWidth - drawWidth) / 2;
            this.ctx.drawImage(img, x, this.cursorY, drawWidth, drawHeight);

            this.cursorY += drawHeight + 20;
            this.cursorX = this.x;
        }
    }

    addLineBreak() {
        this.cursorX = this.x + (this.currentListContext ? (this.config.listIndent * this.currentListContext.level) : 0);
        // Dynamic line height based on current font size
        const currentLineHeight = this.currentStyle.fontSize * 1.15;
        this.cursorY += currentLineHeight;
    }
}

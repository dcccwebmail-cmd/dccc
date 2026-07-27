import { jsPDF } from "jspdf";
import { IdCardConfig, JoinRequest } from "../types";

// Convert an image URL to base64 to avoid CORS issues in jsPDF
const getBase64ImageFromUrl = async (imageUrl: string): Promise<string> => {
    if (!imageUrl) return "";
    try {
        const res = await fetch(imageUrl);
        const blob = await res.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (e) {
        console.error("Error fetching image for base64:", e);
        return "";
    }
};

export const generateIdCardPdf = async (userData: JoinRequest, config: IdCardConfig, download = false): Promise<string> => {
    // Initialize jsPDF
    // @ts-ignore
    const doc = new jsPDF({
        orientation: config.width > config.height ? 'l' : 'p',
        unit: 'mm',
        format: [config.width, config.height]
    });

    // Handle Custom Font
    let fontName = "helvetica";
    if (config.customFontData) {
        try {
            // Add the font file to jsPDF's virtual file system
            doc.addFileToVFS("custom_font.ttf", config.customFontData);
            // Add the font with a name and style
            doc.addFont("custom_font.ttf", "CustomFont", "normal");
            doc.addFont("custom_font.ttf", "CustomFont", "bold");
            doc.addFont("custom_font.ttf", "CustomFont", "italic");
            doc.addFont("custom_font.ttf", "CustomFont", "bolditalic");
            fontName = "CustomFont";
        } catch (e) {
            console.error("Failed to load custom font", e);
        }
    }

    try {
        // 1. Add Background
        if (config.backgroundImageUrl) {
            const bgBase64 = await getBase64ImageFromUrl(config.backgroundImageUrl);
            if (bgBase64) {
                doc.addImage(bgBase64, 'JPEG', 0, 0, config.width, config.height);
            }
        }

        // 2. Add User Photo
        if (userData.personal.image_url && config.fields.photo) {
            try {
                const photoBase64 = await getBase64ImageFromUrl(userData.personal.image_url);
                if (photoBase64) {
                    const { x, y, width, height } = config.fields.photo;
                    doc.addImage(photoBase64, 'JPEG', x, y, width, height);
                }
            } catch (e) {
                console.error("Could not load user photo for PDF", e);
            }
        }

        // 3. Add Text Fields
        const addText = (text: string, fieldConfig: any) => {
            if (!text || !fieldConfig) return;
            doc.setFontSize(fieldConfig.fontSize || 12);
            doc.setTextColor(fieldConfig.color || "#000000");
            
            const isBold = fieldConfig.fontWeight === 'bold';
            const isItalic = fieldConfig.fontStyle === 'italic';
            
            if (isBold && isItalic) doc.setFont(fontName, "bolditalic");
            else if (isBold) doc.setFont(fontName, "bold");
            else if (isItalic) doc.setFont(fontName, "italic");
            else doc.setFont(fontName, "normal");

            doc.text(text, fieldConfig.x, fieldConfig.y, { align: fieldConfig.align || 'left', baseline: 'top' });
            
            if (fieldConfig.textDecoration === 'underline') {
                const textWidth = doc.getTextWidth(text);
                let x = fieldConfig.x;
                if (fieldConfig.align === 'center') x -= textWidth / 2;
                if (fieldConfig.align === 'right') x -= textWidth;
                const textHeightMm = (fieldConfig.fontSize || 12) * 0.3527;
                doc.line(x, fieldConfig.y + textHeightMm + 0.5, x + textWidth, fieldConfig.y + textHeightMm + 0.5); 
            }
        };

        if (config.fields.name) addText(userData.personal.name_en, config.fields.name);
        // @ts-ignore
        if (config.fields.name_bn) addText(userData.personal.name_bn, config.fields.name_bn);
        if (config.fields.id) addText(userData.assignedId || 'PENDING', config.fields.id);
        if (config.fields.roll) addText(userData.academic.roll, config.fields.roll);
        // @ts-ignore
        if (config.fields.section) addText(userData.academic.section, config.fields.section);
        // @ts-ignore
        if (config.fields.session) addText(userData.academic.session || '', config.fields.session);
        if (config.fields.phone) addText(userData.contact.phone, config.fields.phone);
        
        if (config.fields.blood_group) {
            addText(userData.academic.blood_group, config.fields.blood_group);
        }

    } catch (error) {
        console.error("Error generating PDF graphics", error);
    }

    if (download) {
        const safeName = (userData?.personal?.name_en || 'Member').replace(/\s/g, '_');
        doc.save(`DCCC_ID_${safeName}.pdf`);
    }

    const dataUri = doc.output('datauristring');
    return dataUri.split(',')[1];
};

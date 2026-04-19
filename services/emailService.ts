import { jsPDF } from "jspdf";
import { BrevoConfig, IdCardConfig, JoinRequest } from "../types";

interface SendEmailParams {
    brevoConfig: BrevoConfig;
    to: { name: string; email: string };
    subject: string;
    htmlContent: string;
    userData: JoinRequest; // Contains generated ID
    idCardConfig?: IdCardConfig;
}

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

const generateIdCardPdf = async (userData: JoinRequest, config: IdCardConfig): Promise<string> => {
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
            doc.addFont("custom_font.ttf", "CustomFont", "bold"); // Map bold to same font if separate bold not provided
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
                // Use a proxy or ensure CORS is enabled on image source
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
            
            // Set font style
            const isBold = fieldConfig.fontWeight === 'bold';
            const isItalic = fieldConfig.fontStyle === 'italic';
            
            if (isBold && isItalic) doc.setFont(fontName, "bolditalic");
            else if (isBold) doc.setFont(fontName, "bold");
            else if (isItalic) doc.setFont(fontName, "italic");
            else doc.setFont(fontName, "normal");

            doc.text(text, fieldConfig.x, fieldConfig.y, { align: fieldConfig.align || 'left' });
            
            // Basic underline implementation (jsPDF doesn't support textDecoration natively in all versions)
            if (fieldConfig.textDecoration === 'underline') {
                const textWidth = doc.getTextWidth(text);
                let x = fieldConfig.x;
                if (fieldConfig.align === 'center') x -= textWidth / 2;
                if (fieldConfig.align === 'right') x -= textWidth;
                doc.line(x, fieldConfig.y + 1, x + textWidth, fieldConfig.y + 1); // Draw line 1mm below text
            }
        };

        if (config.fields.name) addText(userData.personal.name_en, config.fields.name);
        if (config.fields.id) addText(userData.assignedId || 'PENDING', config.fields.id);
        if (config.fields.roll) addText(userData.academic.roll, config.fields.roll);
        if (config.fields.phone) addText(userData.contact.phone, config.fields.phone);
        
        if (config.fields.blood_group) {
            addText(userData.academic.blood_group, config.fields.blood_group);
        }

    } catch (error) {
        console.error("Error generating PDF graphics", error);
    }

    // Return pure base64 string (without data:application/pdf;base64, prefix)
    const dataUri = doc.output('datauristring');
    return dataUri.split(',')[1];
};

export const sendBrevoEmail = async ({ brevoConfig, to, subject, htmlContent, userData, idCardConfig }: SendEmailParams) => {
    const url = "https://api.brevo.com/v3/smtp/email";
    
    let attachment = null;

    if (idCardConfig) {
        try {
            const pdfBase64 = await generateIdCardPdf(userData, idCardConfig);
            attachment = [
                {
                    content: pdfBase64,
                    name: `DCCC_ID_${userData.personal.name_en.replace(/\s/g, '_')}.pdf`
                }
            ];
        } catch (e) {
            console.error("Failed to generate PDF attachment", e);
        }
    }

    // Replace basic variables in body
    let finalBody = htmlContent
        .replace(/{{name}}/g, userData.personal.name_en)
        .replace(/{{id}}/g, userData.assignedId || 'Pending')
        .replace(/{{roll}}/g, userData.academic.roll);

    const payload = {
        sender: {
            name: brevoConfig.senderName,
            email: brevoConfig.senderEmail
        },
        to: [
            {
                email: to.email,
                name: to.name
            }
        ],
        subject: subject,
        htmlContent: `<html><body>${finalBody}</body></html>`,
        attachment: attachment
    };

    const response = await fetch(url, {
        method: "POST",
        headers: {
            "accept": "application/json",
            "api-key": brevoConfig.apiKey,
            "content-type": "application/json"
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        let errorMessage = "Brevo API Error";
        try {
            const err = await response.json();
            errorMessage = err.message || errorMessage;
        } catch (jsonError) {
            errorMessage = `Brevo API Error: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
    }

    return response.json();
};
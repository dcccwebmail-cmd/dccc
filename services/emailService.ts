import { jsPDF } from "jspdf";
import { ResendConfig, IdCardConfig, JoinRequest } from "../types";

interface SendEmailParams {
    resendConfig: ResendConfig;
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

            doc.text(text, fieldConfig.x, fieldConfig.y, { align: fieldConfig.align || 'left', baseline: 'top' });
            
            // Basic underline implementation (jsPDF doesn't support textDecoration natively in all versions)
            if (fieldConfig.textDecoration === 'underline') {
                const textWidth = doc.getTextWidth(text);
                let x = fieldConfig.x;
                if (fieldConfig.align === 'center') x -= textWidth / 2;
                if (fieldConfig.align === 'right') x -= textWidth;
                // Since baseline is 'top', the text height is roughly fontSize in pt * 0.3527 mm
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
        doc.save(`DCCC_ID_${userData.personal.name_en.replace(/\s/g, '_')}.pdf`);
    }

    // Return pure base64 string (without data:application/pdf;base64, prefix)
    const dataUri = doc.output('datauristring');
    return dataUri.split(',')[1];
};

export const sendResendEmail = async ({ resendConfig, to, subject, htmlContent, userData, idCardConfig }: SendEmailParams) => {
    const url = "/api/email/send";
    
    let attachments = undefined;

    if (idCardConfig) {
        try {
            const pdfBase64 = await generateIdCardPdf(userData, idCardConfig);
            attachments = [
                {
                    content: pdfBase64,
                    filename: `DCCC_ID_${userData.personal.name_en.replace(/\s/g, '_')}.pdf`
                }
            ];
        } catch (e) {
            console.error("Failed to generate PDF attachment", e);
        }
    }

    // Replace variables in body with case-insensitive robust regexes allowing optional spaces
    let finalBody = htmlContent
        .replace(/{{\s*name\s*}}/gi, userData.personal.name_en || '')
        .replace(/{{\s*name_bn\s*}}/gi, userData.personal.name_bn || '')
        .replace(/{{\s*id\s*}}/gi, userData.assignedId || 'Pending')
        .replace(/{{\s*roll\s*}}/gi, userData.academic.roll || '')
        .replace(/{{\s*section\s*}}/gi, userData.academic.section || '')
        .replace(/{{\s*phone\s*}}/gi, userData.contact.phone || '');

    const fromHeader = resendConfig?.senderName 
        ? `${resendConfig.senderName} <${resendConfig.senderEmail}>`
        : resendConfig?.senderEmail;

    const payload = {
        from: fromHeader,
        to: [to.email],
        subject: subject,
        html: `<html><body>${finalBody}</body></html>`,
        attachments: attachments,
        resendApiKey: resendConfig?.apiKey // Send as backup if RESEND_API_KEY env is not configured
    };

    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        let errorMessage = "Resend API Error";
        try {
            const err = await response.json();
            errorMessage = err.error || err.message || errorMessage;
        } catch (jsonError) {
            errorMessage = `Resend API Error: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
    }

    return response.json();
};
const fs = require("fs");
const path = require("path");
const { mailAssets } = require("../common/index");

exports.sendEmail = async () => {
  try {
    const { cart, content, background, mail } = mailAssets;

    // Read files asynchronously and in base64 where needed for images
    const cart_data = await fs.promises.readFile(path.join(__dirname, cart), { encoding: "base64" });
    const cart_content = await fs.promises.readFile(path.join(__dirname, content), { encoding: "utf-8" });
    const cart_background = await fs.promises.readFile(path.join(__dirname, background), { encoding: "base64" });
    const cart_mail = await fs.promises.readFile(path.join(__dirname, mail), { encoding: "utf-8" });

    // Construct the email HTML with inline base64 images
    const mailContent = `<!DOCTYPE html>
                    <html>
                        <body>
                            <div style="box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19);
                                max-width: 800px;
                                margin: 20px auto;
                                padding: 20px;
                                color: #000;"
                            >
                                <h3 style="color: #000">
                                    <img src="data:image/png;base64,${cart_data}" alt="InCrypto" style="width: 40px; margin-right: 10px;" />
                                    Greetings,
                                </h3>
                                <div class="content">${cart_content}</div>
                                <h2 style="text-align: center; color: #000"><strong></strong></h2>
                                <p style="color: #000">${cart_mail}</p>
                                <h1 style="text-align: center; font-weight: 800; "></h1>
                                <img class="background" src="data:image/png;base64,${cart_background}">
                                <p><strong>Kindly note:</strong> Please be aware of phishing sites and always make sure you are visiting the official InCrypto website when entering sensitive data.</p>
                                <p style="margin-top: 60px; text-align: center;">
                                    © 2022 InCrypto. All rights reserved.
                                </p>
                            </div>
                        </body>
                    </html>`;
    
    return mailContent;
  } catch (error) {
    console.error("Error reading email assets:", error.message);
    console.error(error.stack);
    throw error;  // Re-throw error to handle it further up the stack if needed
  }
};

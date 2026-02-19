export const getBaseEmailTemplate = (content: string) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            margin: 0;
            padding: 0;
            background-color: #f8f6f5;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        }

        .email-wrapper {
            width: 100%;
            background-color: #f8f6f5;
            padding: 40px 20px;
        }

        .email-container {
            max-width: 560px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 32px;
            overflow: hidden;
            box-shadow: 0 20px 40px -10px rgba(249, 115, 22, 0.08);
            border: 1px solid rgba(0, 0, 0, 0.03);
        }

        .header {
            padding: 40px 40px 20px 40px;
            text-align: center;
        }

        .logo-text {
            font-size: 32px;
            font-weight: 900;
            margin: 0;
            letter-spacing: -0.04em;
        }

        .uni { color: #f97316; }
        .store { color: #0c6eed; }
        .dot { color: #f97316; }

        .content {
            padding: 0 40px 40px 40px;
            text-align: center;
        }

        .divider {
            height: 1px;
            background-color: #f1f5f9;
            margin: 0 40px;
        }

        .footer {
            padding: 32px 40px;
            text-align: center;
        }

        .footer-logo {
            font-size: 18px;
            font-weight: 800;
            margin-bottom: 8px;
            display: block;
        }

        .help-text {
            font-size: 13px;
            color: #94a3b8;
            line-height: 1.5;
            margin: 0;
        }

        .social-links {
            margin-top: 16px;
        }

        .social-links a {
            color: #f97316;
            text-decoration: none;
            font-size: 12px;
            font-weight: 700;
            margin: 0 8px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }

        /* Responsive */
        @media only screen and (max-width: 480px) {
            .header, .content, .footer {
                padding-left: 20px !important;
                padding-right: 20px !important;
            }
            .headline { font-size: 24px !important; }
        }
    </style>
</head>
<body>
    <div class="email-wrapper">
        <div class="email-container">
            <div class="header">
                <h1 class="logo-text">
                    <span class="uni">Uni</span><span class="store">Store</span><span class="dot">.</span>
                </h1>
            </div>
            
            <div class="content">
                ${content}
            </div>

            <div class="divider"></div>

            <div class="footer">
                <span class="footer-logo">
                    <span class="uni" style="font-size: 14px;">Uni</span><span class="store" style="font-size: 14px;">Store</span>
                </span>
                <p class="help-text">
                    &copy; 2026 UniStore. <br>
                    Made for students, by students.
                </p>
                <div class="social-links">
                    <a href="https://unistore.ng">Website</a>
                    <a href="#">Support</a>
                </div>
            </div>
        </div>
    </div>
</body>
</html>
`;

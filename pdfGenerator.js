$(document).ready(function () {
    // Preload logo into cache so the PDF engine finds it instantly
    const preloadImage = src =>
        new Promise(resolve => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => resolve(null);
            img.src = src;
        });

    $("#btn-download-pdf").on("click", async function () {
        if (!window.currentResultData) return;

        const $btn = $(this);
        $btn.html(
            `Generating... <i class='bx bx-loader-alt bx-spin'></i>`
        ).prop("disabled", true);

        const data = window.currentResultData;
        const generatedDate = new Date().toLocaleDateString("en-IN", {
            day: "numeric",
            month: "long",
            year: "numeric"
        });

        const failedSubjects = [
            ...(data.theory || []),
            ...(data.practical || [])
        ]
            .filter(sub =>
                ["F", "AB", "FAIL"].includes(
                    sub.grade ? sub.grade.trim().toUpperCase() : "-"
                )
            )
            .map(sub => sub.code);
        const finalRemarks =
            failedSubjects.length > 0
                ? `FAIL IN: ${failedSubjects.join(", ")}`
                : "PASS";

        // --- FORMAT FILENAME: JavedIqbalSemIV[DDMMYYYY_HHMMSS] ---
        const safeName = (data.studentName || "Student").replace(/\s+/g, "");
        const semRoman = $(".sem-btn.active").text().trim() || "X";
        const d = new Date();
        const dateStr =
            ("0" + d.getDate()).slice(-2) +
            ("0" + (d.getMonth() + 1)).slice(-2) +
            d.getFullYear();
        const timeStr =
            ("0" + d.getHours()).slice(-2) +
            ("0" + d.getMinutes()).slice(-2) +
            ("0" + d.getSeconds()).slice(-2);
        const pdfFileName = `${safeName}Sem${semRoman}[${dateStr}_${timeStr}].pdf`;

        await preloadImage("AKULogo.png");

        // --- RAW HTML STRING (No DOM manipulation, no UI overlapping) ---
        const pdfHTML = `
        <div style="max-width: 850px; width:100%; background: #ffffff; color: #000000; font-family: 'Arial', sans-serif; position: relative; box-sizing: border-box; margin: 0; padding: 0;">
            
            <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); opacity: 0.05; z-index: 0;">
                <img src="AKULogo.png" style="width: 450px; height: 450px; object-fit: contain;">
            </div>

            <div style="position: relative; z-index: 10; padding: 25px 35px;">
                
                <div style="background: #2b4b8a; width:100%; color: white; padding: 15px 20px; border-radius: 4px; display: flex; align-items: center; justify-content: space-between;">
                    <div style="flex: 1;">
                        <div style="font-size: 8px; letter-spacing: 0.5px; margin-bottom: 3px; text-transform: uppercase;">
                            STATE UNIVERSITY ESTABLISHED BY GOVT. OF BIHAR
                        </div>
                        <div style="font-size: 20px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px;">
                            Aryabhatta Knowledge University
                        </div>
                        <div style="font-size: 10px; margin-top: 3px;">
                            Mithapur, Patna - 800001
                        </div>
                    </div>
                    <div style="background: white; border-radius: 50%; padding: 3px; display: flex; justify-content: center; align-items: center;">
                        <img src="AKULogo.png" style="width: 50px; height: 50px; object-fit: contain;">
                    </div>
                </div>

                <div style="text-align: center; margin-top: 15px; margin-bottom: 15px;">
                    <div style="font-size: 14px; font-weight: 900; color: #2b4b8a; border-bottom: 1px solid #2b4b8a; display: inline-block; padding-bottom: 4px; text-transform: uppercase; letter-spacing: 1px;">
                        STATEMENT OF MARKS
                    </div>
                </div>

                <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                    <tr>
                        <td style="border: 1px solid #d1d5db; padding: 6px 10px; background: #f8fafc; font-weight: bold; font-size: 10px; width: 20%; color: #334155;">Student Name</td>
                        <td style="border: 1px solid #d1d5db; padding: 6px 10px; font-weight: bold; font-size: 11px; width: 30%; color: #000;">${data.studentName || "-"}</td>
                        <td style="border: 1px solid #d1d5db; padding: 6px 10px; background: #f8fafc; font-weight: bold; font-size: 10px; width: 20%; color: #334155;">Registration No</td>
                        <td style="border: 1px solid #d1d5db; padding: 6px 10px; font-weight: bold; font-size: 11px; width: 30%; color: #000;">${data.regNumber || "-"}</td>
                    </tr>
                    <tr>
                        <td style="border: 1px solid #d1d5db; padding: 6px 10px; background: #f8fafc; font-weight: bold; font-size: 10px; color: #334155;">Father's Name</td>
                        <td style="border: 1px solid #d1d5db; padding: 6px 10px; font-size: 11px; color: #000;">${data.fatherName || "-"}</td>
                        <td style="border: 1px solid #d1d5db; padding: 6px 10px; background: #f8fafc; font-weight: bold; font-size: 10px; color: #334155;">Mother's Name</td>
                        <td style="border: 1px solid #d1d5db; padding: 6px 10px; font-size: 11px; color: #000;">${data.motherName || "-"}</td>
                    </tr>
                    <tr>
                        <td style="border: 1px solid #d1d5db; padding: 6px 10px; background: #f8fafc; font-weight: bold; font-size: 10px; color: #334155;">College</td>
                        <td style="border: 1px solid #d1d5db; padding: 6px 10px; font-size: 11px; color: #000;" colspan="3">${data.college || "-"}</td>
                    </tr>
                    <tr>
                        <td style="border: 1px solid #d1d5db; padding: 6px 10px; background: #f8fafc; font-weight: bold; font-size: 10px; color: #334155;">Course</td>
                        <td style="border: 1px solid #d1d5db; padding: 6px 10px; font-size: 11px; color: #000;" colspan="3">${data.course || "-"}</td>
                    </tr>
                </table>

                ${
                    data.theory && data.theory.length > 0
                        ? `
                <div style="font-size: 10px; font-weight: 800; color: #64748b; margin-bottom: 5px; text-transform: uppercase; border-left: 3px solid #2b4b8a; padding-left: 6px;">Theory Papers</div>
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
                    <thead><tr>
                        <th style="background: #f1f5f9; color: #2b4b8a; font-size: 9px; font-weight: 800; padding: 6px; border: 1px solid #cbd5e1; text-align: left; width: 15%;">Code</th>
                        <th style="background: #f1f5f9; color: #2b4b8a; font-size: 9px; font-weight: 800; padding: 6px; border: 1px solid #cbd5e1; text-align: left;">Subject Name</th>
                        <th style="background: #f1f5f9; color: #2b4b8a; font-size: 9px; font-weight: 800; padding: 6px; border: 1px solid #cbd5e1; text-align: center; width: 8%;">ESE</th>
                        <th style="background: #f1f5f9; color: #2b4b8a; font-size: 9px; font-weight: 800; padding: 6px; border: 1px solid #cbd5e1; text-align: center; width: 8%;">IA</th>
                        <th style="background: #f1f5f9; color: #2b4b8a; font-size: 9px; font-weight: 800; padding: 6px; border: 1px solid #cbd5e1; text-align: center; width: 8%;">Total</th>
                        <th style="background: #f1f5f9; color: #2b4b8a; font-size: 9px; font-weight: 800; padding: 6px; border: 1px solid #cbd5e1; text-align: center; width: 8%;">Grade</th>
                    </tr></thead>
                    <tbody>
                        ${data.theory
                            .map(
                                sub => `
                            <tr>
                                <td style="padding: 6px; font-size: 10px; border: 1px solid #cbd5e1; font-weight: bold; text-align: center; color: #334155;">${sub.code || "-"}</td>
                                <td style="padding: 6px; font-size: 10px; border: 1px solid #cbd5e1; font-weight: bold; color: #000;">${sub.name || "-"}</td>
                                <td style="padding: 6px; font-size: 10px; border: 1px solid #cbd5e1; text-align: center; color: #000;">${sub.ese || "-"}</td>
                                <td style="padding: 6px; font-size: 10px; border: 1px solid #cbd5e1; text-align: center; color: #000;">${sub.ia || "-"}</td>
                                <td style="padding: 6px; font-size: 10px; border: 1px solid #cbd5e1; text-align: center; font-weight: bold; color: #000;">${sub.total || "-"}</td>
                                <td style="padding: 6px; font-size: 10px; border: 1px solid #cbd5e1; text-align: center; font-weight: bold; color: ${["F", "AB", "FAIL"].includes(sub.grade ? sub.grade.trim().toUpperCase() : "-") ? "#d63031" : "#009432"};">
                                    ${sub.grade || "-"}
                                </td>
                            </tr>
                        `
                            )
                            .join("")}
                    </tbody>
                </table>
                `
                        : ""
                }

                ${
                    data.practical && data.practical.length > 0
                        ? `
                <div style="font-size: 10px; font-weight: 800; color: #64748b; margin-bottom: 5px; text-transform: uppercase; border-left: 3px solid #2b4b8a; padding-left: 6px;">Practical Papers</div>
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
                    <thead><tr>
                        <th style="background: #f1f5f9; color: #2b4b8a; font-size: 9px; font-weight: 800; padding: 6px; border: 1px solid #cbd5e1; text-align: left; width: 15%;">Code</th>
                        <th style="background: #f1f5f9; color: #2b4b8a; font-size: 9px; font-weight: 800; padding: 6px; border: 1px solid #cbd5e1; text-align: left;">Subject Name</th>
                        <th style="background: #f1f5f9; color: #2b4b8a; font-size: 9px; font-weight: 800; padding: 6px; border: 1px solid #cbd5e1; text-align: center; width: 8%;">ESE</th>
                        <th style="background: #f1f5f9; color: #2b4b8a; font-size: 9px; font-weight: 800; padding: 6px; border: 1px solid #cbd5e1; text-align: center; width: 8%;">IA</th>
                        <th style="background: #f1f5f9; color: #2b4b8a; font-size: 9px; font-weight: 800; padding: 6px; border: 1px solid #cbd5e1; text-align: center; width: 8%;">Total</th>
                        <th style="background: #f1f5f9; color: #2b4b8a; font-size: 9px; font-weight: 800; padding: 6px; border: 1px solid #cbd5e1; text-align: center; width: 8%;">Grade</th>
                    </tr></thead>
                    <tbody>
                        ${data.practical
                            .map(
                                sub => `
                            <tr>
                                <td style="padding: 6px; font-size: 10px; border: 1px solid #cbd5e1; font-weight: bold; text-align: center; color: #334155;">${sub.code || "-"}</td>
                                <td style="padding: 6px; font-size: 10px; border: 1px solid #cbd5e1; font-weight: bold; color: #000;">${sub.name || "-"}</td>
                                <td style="padding: 6px; font-size: 10px; border: 1px solid #cbd5e1; text-align: center; color: #000;">${sub.ese || "-"}</td>
                                <td style="padding: 6px; font-size: 10px; border: 1px solid #cbd5e1; text-align: center; color: #000;">${sub.ia || "-"}</td>
                                <td style="padding: 6px; font-size: 10px; border: 1px solid #cbd5e1; text-align: center; font-weight: bold; color: #000;">${sub.total || "-"}</td>
                                <td style="padding: 6px; font-size: 10px; border: 1px solid #cbd5e1; text-align: center; font-weight: bold; color: ${["F", "AB", "FAIL"].includes(sub.grade ? sub.grade.trim().toUpperCase() : "-") ? "#d63031" : "#009432"};">
                                    ${sub.grade || "-"}
                                </td>
                            </tr>
                        `
                            )
                            .join("")}
                    </tbody>
                </table>
                `
                        : ""
                }

                ${
                    data.sgpaHistory && data.sgpaHistory.length > 0
                        ? `
                <div style="font-size: 10px; font-weight: 800; color: #64748b; margin-bottom: 5px; text-transform: uppercase; border-left: 3px solid #2b4b8a; padding-left: 6px;">Academic History</div>
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
                    <thead><tr>${["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "CUR. CGPA"].map(h => `<th style="background: #f1f5f9; color: #2b4b8a; font-size: 9px; font-weight: 800; padding: 6px; border: 1px solid #cbd5e1; text-align: center;">${h}</th>`).join("")}</tr></thead>
                    <tbody><tr>${data.sgpaHistory.map((val, idx) => `<td style="padding: 6px; font-size: 10px; border: 1px solid #cbd5e1; text-align: center; font-weight: ${idx === 8 ? "900" : "bold"}; color: ${idx === 8 ? "#2b4b8a" : "#000"};">${val || "-"}</td>`).join("")}</tr></tbody>
                </table>
                `
                        : ""
                }

                <div style="margin-top: 15px; border-top: 1px solid #d1d5db; padding-top: 10px; display: flex; justify-content: space-between; align-items: flex-end;">
                    <div>
                        <div style="font-size: 9px; font-weight: bold; margin-bottom: 2px; text-transform: uppercase; color: #64748b;">Remarks</div>
                        <div style="font-size: 11px; font-weight: 900; color: ${finalRemarks === "PASS" ? "#009432" : "#d63031"};">
                            ${finalRemarks}
                        </div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 9px; font-weight: bold; text-transform: uppercase; color: #64748b; margin-bottom: -2px;">SGPA</div>
                        <div style="font-size: 22px; font-weight: 900; color: #000;">
                            ${data.sgpa || "-"}
                        </div>
                    </div>
                </div>

                <div style="text-align: center; margin-top: 20px; font-size: 7px; color: #94a3b8;">
                    Generated on ${generatedDate}. This result is for immediate information only.
                </div>

            </div>
        </div>
        `;

        const opt = {
            margin: [-7, -20, 0, -9],
            // margin: 0,
            padding: 0,
            filename: pdfFileName,
            image: { type: "png", quality: 9 },
            html2canvas: {
                scale: 4,
                useCORS: true,
                scrollY: 0,
                windowWidth: 1000,
                logging: false,
                letterRendering: true
            },
            jsPDF: { unit: "mm", format: "a4", orientation: "portrait" }
        };

        try {
            // Passes the string directly. It creates an isolated internal iframe automatically.
            await html2pdf().set(opt).from(pdfHTML).save();
        } catch (error) {
            console.error(error);
            Swal.fire({
                icon: "error",
                title: "PDF Error",
                text: "Failed to generate PDF.",
                customClass: { popup: "sweetAlert" },
                background: "var(--tab)",
                color: "var(--text)"
            });
        } finally {
            $btn.html(`Download PDF <i class='bx bxs-file-pdf'></i>`).prop(
                "disabled",
                false
            );
        }
    });
});

$(document).ready(function () {
    const API_URL =
        "https://us-central1-dashboard-4aa16.cloudfunctions.net/getUnifiedAkuResult";

    let currentSem = null;
    let allStudents = [];
    let currentFilter = "";
    let currentPage = 1;
    const itemsPerPage = 10;

    // --- THEME LOGIC ---
    let savedTheme = localStorage.getItem("theme");
    if (!savedTheme) {
        savedTheme = "light";
        localStorage.setItem("theme", "light");
    }

    if (savedTheme === "dark") {
        $("body").addClass("dark");
        $("#theme-toggle").html("<i class='bx bx-sun'></i>");
    } else {
        $("body").removeClass("dark");
        $("#theme-toggle").html("<i class='bx bx-moon'></i>");
    }

    $("#theme-toggle").on("click", function () {
        $("body").toggleClass("dark");
        const isDark = $("body").hasClass("dark");
        localStorage.setItem("theme", isDark ? "dark" : "light");
        $(this).html(
            isDark ? "<i class='bx bx-sun'></i>" : "<i class='bx bx-moon'></i>"
        );
    });

    // --- SWEETALERT ---
    const Toast = Swal.mixin({
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 2000,
        customClass: { popup: "sweetToast" }
    });
    const Alert = Swal.mixin({
        customClass: { popup: "sweetAlert" },
        buttonsStyling: true,
        confirmButtonColor: "var(--icon)"
    });

    // --- DATA FETCH ---
    async function loadStudents() {
        try {
            const res = await fetch("students.json");
            allStudents = await res.json();
            renderStudents();
        } catch (error) {
            Alert.fire({
                icon: "error",
                title: "Error",
                text: "Failed to load student data.",
                confirmButtonText: "OK"
            });
        }
    }

    $(".sem-btn").on("click", function () {
        $(".sem-btn").removeClass("active");
        $(this).addClass("active");
        currentSem = $(this).attr("data-sem");
        $("#result-wrapper").hide();
    });

    $(".type-btn").on("click", function () {
        $(".type-btn").removeClass("active");
        $(this).addClass("active");
        if ($(this).attr("data-type") === "list") {
            $("#view-list").show();
            $("#view-reg").hide();
        } else {
            $("#view-list").hide();
            $("#view-reg").show();
        }
        $("#result-wrapper").hide();
    });

    function renderStudents() {
        const $listBody = $("#student-list-body");
        const $pagination = $("#pagination-controls");
        $listBody.empty();
        $pagination.empty();

        const filtered = allStudents.filter(
            s =>
                s.name.toLowerCase().includes(currentFilter.toLowerCase()) ||
                s.regNumber.includes(currentFilter) ||
                s.roll.includes(currentFilter)
        );

        if (filtered.length === 0) {
            $listBody.append(
                `<div class="table-row"><div class="table-cell" style="flex:1;">No students found</div></div>`
            );
            return;
        }

        const totalPages = Math.ceil(filtered.length / itemsPerPage);
        if (currentPage > totalPages) currentPage = totalPages || 1;
        const startIdx = (currentPage - 1) * itemsPerPage;

        filtered.slice(startIdx, startIdx + itemsPerPage).forEach(s => {
            const isLeft = s.status === "a";
            const bgStyle = isLeft
                ? "background-color: rgba(214, 48, 49, 0.15); color: var(--logout); font-weight: bold;"
                : "";

            const $row = $(`
                <div class="table-row noselect" style="${bgStyle}">
                    <div class="table-cell">2022BP${s.roll}</div>
                    <div class="table-cell stName" style="font-weight: 600;">${s.name}</div>
                    <div class="table-cell">${s.regNumber}</div>
                </div>
            `);

            $row.on("click", function () {
                if (isLeft) {
                    Alert.fire({
                        icon: "error",
                        title: "Left The Course",
                        confirmButtonText: "OK"
                    });
                } else {
                    fetchResult(s.regNumber);
                }
            });
            $listBody.append($row);
        });

        if (totalPages > 1) {
            for (let i = 1; i <= totalPages; i++) {
                const btnClass = i === currentPage ? "active" : "";
                const $btn = $(`<a class="${btnClass}">${i}</a>`);
                $btn.on("click", function () {
                    currentPage = i;
                    renderStudents();
                });
                $pagination.append($btn);
            }
        }
    }

    $("#list-search").on("input", function () {
        currentFilter = $(this).val().trim();
        currentPage = 1;
        renderStudents();
    });

    $("#btn-search-reg").on("click", function () {
        const reg = $("#reg-input").val().trim();
        if (reg.length > 5) fetchResult(reg);
        else
            Alert.fire({
                icon: "warning",
                title: "Invalid Reg. Number",
                confirmButtonText: "OK"
            });
    });

    $("#reg-input").on("keypress", function (e) {
        if (e.which == 13) $("#btn-search-reg").click();
    });

    // --- SKELETON LOADER ---
    function displaySkeletonUI() {
        $("#result-wrapper").show();

        const skeletonLine = `<div style="height: 12px; width: 100px; border-radius: 4px; background: linear-gradient(90deg, var(--lightTab) 25%, var(--tab) 50%, var(--lightTab) 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; display: inline-block;"></div>`;
        const skeletonBlock = `<div style="height: 20px; width: 50px; border-radius: 4px; background: linear-gradient(90deg, var(--lightTab) 25%, var(--tab) 50%, var(--lightTab) 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; display: inline-block;"></div>`;

        $("#res-name").html(skeletonLine);
        $("#res-reg").html(skeletonLine);
        $("#res-course").html(skeletonLine);
        $("#res-college").html(skeletonLine);

        const skeletonRow = `
            <div class="table-row noselect">
                <div class="table-cell stName"><div style="height: 10px; width: 80%; border-radius: 4px; background: linear-gradient(90deg, var(--lightTab) 25%, var(--tab) 50%, var(--lightTab) 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite;"></div></div>
                <div class="table-cell"><div style="height: 10px; width: 20px; border-radius: 4px; background: linear-gradient(90deg, var(--lightTab) 25%, var(--tab) 50%, var(--lightTab) 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite;"></div></div>
                <div class="table-cell"><div style="height: 10px; width: 20px; border-radius: 4px; background: linear-gradient(90deg, var(--lightTab) 25%, var(--tab) 50%, var(--lightTab) 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite;"></div></div>
                <div class="table-cell"><div style="height: 10px; width: 20px; border-radius: 4px; background: linear-gradient(90deg, var(--lightTab) 25%, var(--tab) 50%, var(--lightTab) 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite;"></div></div>
                <div class="table-cell"><div style="height: 10px; width: 20px; border-radius: 4px; background: linear-gradient(90deg, var(--lightTab) 25%, var(--tab) 50%, var(--lightTab) 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite;"></div></div>
            </div>`;

        $("#theory-container").show();
        $("#theory-body").html(skeletonRow.repeat(4));

        $("#practical-container").show();
        $("#practical-body").html(skeletonRow.repeat(2));

        $("#res-remarks").html(skeletonBlock);
    }

    // --- API FETCH ---
    async function fetchResult(regNumber) {
        if (!currentSem)
            return Alert.fire({
                icon: "warning",
                title: "Select a Semester first!",
                confirmButtonText: "OK"
            });

        displaySkeletonUI();
        $("html, body").animate(
            { scrollTop: $("#result-wrapper").offset().top - 20 },
            400
        );

        try {
            const res = await fetch(
                `${API_URL}?s=${currentSem}&reg=${regNumber}`
            );
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Result not found");

            window.currentResultData = data;
            Toast.fire({ icon: "success", title: "Result Fetched" });

            setTimeout(() => {
                renderResultUI(data);
            }, 300);
        } catch (err) {
            $("#result-wrapper").hide();
            Alert.fire({
                icon: "error",
                title: "Failed",
                text: err.message,
                confirmButtonText: "OK"
            });
        }
    }

    function renderResultUI(data) {
        $("#res-name").text(data.studentName || "-");
        $("#res-reg").text(data.regNumber || "-");
        $("#res-course").text(data.course || "-");
        $("#res-college").text(data.college || "-");

        const buildRow = sub => {
            const isFail = ["F", "AB", "FAIL"].includes(
                sub.grade ? sub.grade.trim().toUpperCase() : "-"
            );
            const cleanName =
                sub.name.replace(/^PHARMA/i, "").trim() || "Unknown";
            return `
                <div class="table-row noselect">
                    <div class="table-cell stName" style="flex-direction: column; align-items: center; justify-content: center;">
                        <span style="font-weight: 600; font-size: 10px; display: block;">${cleanName}</span>
                        <span style="font-size: 8px; opacity: 0.6;">${sub.code}</span>
                    </div>
                    <div class="table-cell">${sub.ese || "-"}</div>
                    <div class="table-cell">${sub.ia || "-"}</div>
                    <div class="table-cell" style="font-weight: bold;">${sub.total || "-"}</div>
                    <div class="table-cell ${isFail ? "fail-text" : "pass-text"}">${sub.grade || "-"}</div>
                </div>
            `;
        };

        if (data.theory && data.theory.length > 0) {
            $("#theory-container").show();
            $("#theory-body").html(data.theory.map(buildRow).join(""));
        } else $("#theory-container").hide();

        if (data.practical && data.practical.length > 0) {
            $("#practical-container").show();
            $("#practical-body").html(data.practical.map(buildRow).join(""));
        } else $("#practical-container").hide();

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

        if (failedSubjects.length > 0) {
            $("#res-remarks").html(
                `<div style="color: var(--logout); font-size: 11px; font-weight: 800; margin-bottom: 5px;">FAIL : ${failedSubjects.join(", ")}</div><div style="font-size: 11px; font-weight: 900; color: var(--text);">SGPA : ${data.sgpa}</div>`
            );
        } else {
            $("#res-remarks").html(
                `<div style="font-size: 11px; font-weight: 900; color: var(--text);">SGPA : ${data.sgpa}</div>`
            );
        }
    }

    // --- SERVER-SIDE PDF DOWNLOAD HANDLER ---
    $("#btn-download-pdf").on("click", async function () {
        if (!currentSem || !window.currentResultData) return;

        const regNumber = window.currentResultData.regNumber;
        const $btn = $(this);
        const originalHtml = $btn.html();

        $btn.html(
            `Downloading... <i class='bx bx-loader-alt bx-spin'></i>`
        ).prop("disabled", true);

        try {
            const pdfUrl = `${API_URL}?s=${currentSem}&reg=${regNumber}&pdf=true`;
            const response = await fetch(pdfUrl);

            if (!response.ok) throw new Error("Failed to connect to server.");

            const result = await response.json();

            if (result.error) throw new Error(result.error);
            if (!result.pdfData) throw new Error("Received empty PDF data.");

            // --- SMART BYTE DECODER ---
            let byteArray;

            // Check if Firebase sent it as a comma-separated string (e.g. "37,80,68,70...")
            if (
                typeof result.pdfData === "string" &&
                result.pdfData.includes(",")
            ) {
                byteArray = new Uint8Array(
                    result.pdfData.split(",").map(Number)
                );
            }
            // Check if Firebase sent it as a buffer JSON object { type: "Buffer", data: [...] }
            else if (result.pdfData.type === "Buffer" && result.pdfData.data) {
                byteArray = new Uint8Array(result.pdfData.data);
            }
            // Otherwise, process it as standard Base64
            else {
                const byteCharacters = atob(result.pdfData);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                byteArray = new Uint8Array(byteNumbers);
            }

            // Create and trigger the PDF download
            const blob = new Blob([byteArray], { type: "application/pdf" });
            const url = window.URL.createObjectURL(blob);

            const a = document.createElement("a");
            a.style.display = "none";
            a.href = url;
            a.download = result.fileName || `Result_${regNumber}.pdf`;

            document.body.appendChild(a);
            a.click();

            // Cleanup
            window.URL.revokeObjectURL(url);
            a.remove();
        } catch (error) {
            Alert.fire({
                icon: "error",
                title: "Download Error",
                text: error.message,
                confirmButtonText: "OK"
            });
        } finally {
            $btn.html(originalHtml).prop("disabled", false);
        }
    });

    loadStudents();
});

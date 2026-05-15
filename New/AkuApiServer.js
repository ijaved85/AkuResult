process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const axios = require("axios");
const cheerio = require("cheerio");
const { wrapper } = require("axios-cookiejar-support");
const { CookieJar } = require("tough-cookie");
const cors = require("cors")({ origin: true });

const SEMESTER_CONFIG = {
    "1": { type: "old", urlTemplate: "https://oldresult.akuexam.net/ResultsBPharm1stSemPub2022.aspx?Sem=I&RegNo=[REG]" },
    "2": { type: "old", urlTemplate: "https://oldresult.akuexam.net/ResultsBPharm2ndSemPub2023.aspx?Sem=II&RegNo=[REG]" },
    "3": { type: "old", urlTemplate: "https://oldresult.akuexam.net/ResultsBPharm3rdSemPub2023.aspx?Sem=III&RegNo=[REG]" },
    "4": { type: "old", urlTemplate: "https://oldresult.akuexam.net/ResultsBPharm4thSemPub2024.aspx?Sem=IV&RegNo=[REG]" },
    "5": { type: "old", urlTemplate: "https://oldresult.akuexam.net/ResultsBPharm5th_Sem2024Pub.aspx?Sem=V&RegNo=[REG]" },
    "6": { type: "new", examId: "5098" },
};

const scrapeOldSystem = async (url) => {
    const response = await axios.get(url, {
        timeout: 15000,
        headers: { "User-Agent": "Mozilla/5.0" }
    });

    const $ = cheerio.load(response.data);

    const getText = suffix => {
        let el = $(`span[id$='${suffix}']`);
        if (el.length > 0) return el.text().trim();
        el = $(`[id$='${suffix}']`);
        return el.length > 0 ? el.text().trim() : "";
    };

    const extractGrid = idSuffix => {
        const rows = [];
        const table = $(`table[id$='${idSuffix}']`);
        table.find("tr").each((i, el) => {
            if (i === 0) return;
            const tds = $(el).find("td");
            if (tds.length >= 6) {
                rows.push({
                    code: $(tds[0]).text().trim(),
                    name: $(tds[1]).text().trim(),
                    ese: $(tds[2]).text().trim(),
                    ia: $(tds[3]).text().trim(),
                    total: $(tds[4]).text().trim(),
                    grade: $(tds[5]).text().trim()
                });
            }
        });
        return rows;
    };

    const historyRows = [];
    const histTable = $(`table[id$='GridView3']`);
    histTable.find("tr").each((i, el) => {
        if (i === 1) {
            $(el).find("td").each((index, td) => {
                historyRows.push($(td).text().trim());
            });
        }
    });

    const studentName = getText("StudentNameLabel_0");
    if (!studentName) throw new Error("Result not found or invalid Registration Number");

    return {
        studentName,
        regNumber: getText("RegistrationNoLabel_0"),
        fatherName: getText("FatherNameLabel_0"),
        motherName: getText("MotherNameLabel_0"),
        college: getText("CollegeNameLabel_0"),
        course: getText("CourseLabel_0"),
        sgpa: getText("GROSSTHEORYTOTALLabel_0"),
        remarks: getText("remarkLabel_0"),
        theory: extractGrid("GridView1"),
        practical: extractGrid("GridView2"),
        sgpaHistory: historyRows
    };
};

const scrapeNewSystem = async (regNum, examId) => {
    const jar = new CookieJar();
    const client = wrapper(
        axios.create({
            jar,
            withCredentials: true,
            timeout: 20000,
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
            }
        })
    );

    const baseDomain = "https://results.akuexam.net";

    await client.get(`${baseDomain}/default.aspx`);
    await new Promise((r) => setTimeout(r, 1000));

    await client.post(
        `${baseDomain}/default.aspx/SaveExamIdInSession`,
        JSON.stringify({ examId: String(examId) }),
        {
            headers: {
                "Content-Type": "application/json; charset=utf-8",
                "X-Requested-With": "XMLHttpRequest",
                "Referer": `${baseDomain}/default.aspx`
            },
        }
    );

    await new Promise((r) => setTimeout(r, 1000));

    const viewRes = await client.get(`${baseDomain}/ResultView.aspx`);
    const $form = cheerio.load(viewRes.data);
    const viewState = $form("#__VIEWSTATE").val();
    const viewStateGenerator = $form("#__VIEWSTATEGENERATOR").val();
    const eventValidation = $form("#__EVENTVALIDATION").val();

    if (!viewState) throw new Error("Access Denied (Server Busy)");

    const params = new URLSearchParams();
    params.append("__VIEWSTATE", viewState);
    params.append("__VIEWSTATEGENERATOR", viewStateGenerator || "");
    params.append("__EVENTVALIDATION", eventValidation || "");
    params.append("ctl00$MainContent$txtRegistrationNumber", regNum);
    params.append("ctl00$MainContent$btnViewResult", "View Result");

    const finalRes = await client.post(
        `${baseDomain}/ResultView.aspx`,
        params.toString(),
        {
            headers: { 
                "Content-Type": "application/x-www-form-urlencoded",
                "Referer": `${baseDomain}/ResultView.aspx`
            },
        }
    );

    const $ = cheerio.load(finalRes.data);
    const getText = (id) => $(`#${id}`).text().trim();

    const studentName = getText("MainContent_lblStudentName");
    if (!studentName) throw new Error("Result not found for this Registration Number");

    const theory = [];
    const practical = [];

    $("#MainContent_gvSubjects tr").each((i, el) => {
        if (i === 0) return;
        const tds = $(el).find("td");
        if (tds.length >= 6) {
            const sub = {
                code: $(tds[0]).text().trim(),
                name: $(tds[1]).text().trim(),
                ia: $(tds[2]).text().trim(),
                ese: $(tds[3]).text().trim(),
                total: $(tds[4]).text().trim(),
                grade: $(tds[5]).text().trim(),
            };
            if (sub.code.toUpperCase().endsWith("P")) {
                practical.push(sub);
            } else {
                theory.push(sub);
            }
        }
    });

    const sgpaHistory = [];
    for (let i = 1; i <= 8; i++) {
        const val = $(`#MainContent_lblSGPA${i}`).text().trim();
        sgpaHistory.push(val ? val : "NA");
    }

    const cgpa = $("#MainContent_lblCGPA").text().trim();
    sgpaHistory.push(cgpa ? cgpa : "NA");

    return {
        studentName,
        regNumber: getText("MainContent_lblRegNo"),
        fatherName: getText("MainContent_lblFatherName"),
        motherName: getText("MainContent_lblMotherName"),
        college: getText("MainContent_lblCollege"),
        course: getText("MainContent_lblCourse"),
        sgpa: getText("MainContent_lblCurSGPA"),
        remarks: getText("MainContent_lblRemarks"),
        theory,
        practical,
        sgpaHistory,
    };
};

exports.getUnifiedAkuResult = (req, res) => {
    cors(req, res, async () => {
        try {
            const s = req.query.s || req.body.s;
            const reg = req.query.reg || req.body.reg;

            if (!s || !reg) {
                return res.status(400).json({ error: "Missing parameter: s or reg" });
            }

            const config = SEMESTER_CONFIG[String(s).toUpperCase()] || SEMESTER_CONFIG[s];

            if (!config) {
                return res.status(404).json({ error: "Result not declared or configuration missing for this semester" });
            }

            let resultData;

            if (config.type === "old") {
                const targetUrl = config.urlTemplate.replace("[REG]", reg);
                resultData = await scrapeOldSystem(targetUrl);
            } else if (config.type === "new") {
                resultData = await scrapeNewSystem(reg, config.examId);
            }

            return res.status(200).json(resultData);

        } catch (error) {
            console.error("Backend Error:", error.message);
            return res.status(500).json({ error: error.message });
        }
    });
};

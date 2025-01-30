const express = require("express");
const bodyParser = require("body-parser");
const db = require("./db");
const cors = require('cors');
const app = express();
const axios = require('axios');
const fs = require('fs'); 

app.use(cors()); 
app.use(bodyParser.json());

app.get("/get-last-req", (req, res) => {
    const dbConnection = db; 

    // Fetch the last reqMasId from the table
    const fetchLastReqFormIdQuery = `SELECT MAX(reqId) AS lastReqFormId FROM owsReqForm`;

    dbConnection.query(fetchLastReqFormIdQuery, (fetchErr, fetchResult) => {
        if (fetchErr) {
            console.error("Failed to fetch the last reqMasId:", fetchErr);
            return res.status(500).send({
                error: "Failed to fetch the last reqMasId",
                details: fetchErr,
            });
        }

        const lastReqFormId = fetchResult[0].lastReqFormId || 0; // Default to 0 if no rows exist
        const nextReqFormId = lastReqFormId + 1; // Increment by 1

        console.log("Next reqMasId:", nextReqFormId);

        // Send the nextReqMasId back to the client
        res.status(200).send({ nextReqFormId });
    });
});

app.post("/add-request", (req, res) => {
    const data = req.body;

    const owsReqMasQuery = `
        INSERT IGNORE INTO owsReqMas (
    reqMasId, reqDt, ITS, name, fullName, mohalla, address, dob, email, mobile, whatsapp
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `;

    const owsReqFormQuery = `
        INSERT INTO owsReqForm (
            reqId, ITS, reqByITS, reqByName, city, institution, class_degree, 
            fieldOfStudy, subject_course, yearOfStart, grade, email, contactNo, 
            whatsappNo, purpose, fundAsking, classification, organization, 
            description, currentStatus, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const dbConnection = db; 

    dbConnection.beginTransaction((err) => {
        if (err) {
            console.error("Transaction failed to start:", err);
            return res.status(500).send({ error: "Transaction failed to start", details: err });
        }

        // Fetch the last reqMasId from the table
        const fetchLastReqMasIdQuery = `SELECT MAX(reqMasId) AS lastReqMasId FROM owsReqMas`;

        dbConnection.query(fetchLastReqMasIdQuery, (fetchErr, fetchResult) => {
            if (fetchErr) {
                console.error("Failed to fetch the last reqMasId:", fetchErr);
                return dbConnection.rollback(() => {
                    res.status(500).send({ error: "Failed to fetch the last reqMasId", details: fetchErr });
                });
            }

            const lastReqMasId = fetchResult[0].lastReqMasId || 0; // Default to 0 if no rows exist
            const nextReqMasId = lastReqMasId + 1; // Increment by 1

            // Insert into owsReqMas
            const reqMasValues = [
                nextReqMasId,
                new Date().toISOString().slice(0, 19).replace("T", " "), // Current timestamp for reqDt
                data.memberITS,
                data.firstName || null,
                data.fullName,
                data.mohalla || null,
                data.address || null,
                data.dob || null,
                data.email || null,
                data.phoneNumber || null,
                data.whatsappNumber || null,
            ];

            dbConnection.query(owsReqMasQuery, reqMasValues, (masErr, masResult) => {
                if (masErr) {
                    console.error("Failed to insert data into owsReqMas:", masErr);
                    return dbConnection.rollback(() => {
                        res.status(500).send({ error: "Failed to insert data into owsReqMas", details: masErr });
                    });
                }

                const fetchLastReqFormIdQuery = `SELECT MAX(reqId) AS lastReqFormId FROM owsReqForm`;


                dbConnection.query(fetchLastReqFormIdQuery, (fetchErr, fetchResult) => {
                    if (fetchErr) {
                        console.error("Failed to fetch the last reqMasId:", fetchErr);
                        return res.status(500).send({
                            error: "Failed to fetch the last reqMasId",
                            details: fetchErr,
                        });
                    }

                    const lastReqFormId = fetchResult[0].lastReqFormId || 0; // Default to 0 if no rows exist
                    const nextReqFormId = lastReqFormId + 1; // Increment by 1

                    const reqFormValues = [
                        nextReqFormId, 
                        data.memberITS,
                        data.appliedby,
                        data.appliedby, 
                        data.city,
                        data.institution,
                        data.classDegree,
                        data.study,
                        data.subject,
                        data.year,
                        null, 
                        data.email,
                        data.phoneNumber,
                        data.whatsappNumber,
                        "Education Assistance", 
                        data.fundAmount,
                        "Education", 
                        null, 
                        data.fundDescription,
                        "Pending", 
                        data.appliedby, 
                    ];

                    dbConnection.query(owsReqFormQuery, reqFormValues, (formErr, formResult) => {
                        if (formErr) {
                            console.error("Failed to insert data into owsReqForm:", formErr);
                            return dbConnection.rollback(() => {
                                res.status(500).send({ error: "Failed to insert data into owsReqForm", details: formErr });
                            });
                        }
                    });

                    // Commit the transaction
                    dbConnection.commit((commitErr) => {
                        if (commitErr) {
                            console.error("Failed to commit transaction:", commitErr);
                            return dbConnection.rollback(() => {
                                res.status(500).send({ error: "Failed to commit transaction", details: commitErr });
                            });
                        }

                        console.log("Data inserted successfully");

                        res.send({ message: "Data inserted successfully", reqMasId: nextReqMasId });
                    });
                });
            });
        });
    });
});

app.get('/get-requests', (req, res) => {
    const id = req.query.id;

    let query = 'SELECT * FROM RequestForm';
    if (id) {
        query += ' WHERE id = ?';
    }

    db.query(query, [id], (err, results) => {
        if (err) {
            console.error(err);
            res.status(500).send(err);
        } else {
            res.json(results);
        }
    });
});

app.get('/fetch-image', async (req, res) => {
    try {
        const { url } = req.query;

        // Validate the URL
        if (!url) {
            return res.status(400).send('Image URL is required');
        }

        // Fetch the image
        const response = await axios.get(url, { responseType: 'arraybuffer' });

        // Set the appropriate headers
        res.setHeader('Content-Type', response.headers['content-type']);
        res.setHeader('Content-Length', response.headers['content-length']);

        // Send the image buffer
        res.send(response.data);
    } catch (error) {
        console.error('Error fetching image:', error.message);
        res.status(500).send('Failed to fetch image');
    }
});

// Endpoint to fetch profile data
app.get("/get-profile/:itsId", async (req, res) => {
    const itsId = req.params.itsId;

    // URL with dynamic `itsId`
    const url = `https://paktalim.com/admin/ws_app/GetProfileEducation/${itsId}?access_key=8803c22b50548c9d5b1401e3ab5854812c4dcacb&username=40459629&password=1107865253`;

    try {
        const response = await axios.get(url);
        res.status(200).json(response.data);
    } catch (error) {
        console.error("Error fetching profile data:", error.message);
        res.status(500).json({ error: "Failed to fetch profile data" });
    }
});

// Endpoint to fetch family profile data
app.get("/get-family-profile/:itsId", async (req, res) => {
    const itsId = req.params.itsId;

    // URL with dynamic `itsId`
    const url = `https://paktalim.com/admin/ws_app/GetProfileFamily/${itsId}?access_key=c197364bbcef92456a31b1773941964a728e2c33&username=40459629&password=1107865253`;

    try {
        const response = await axios.get(url);
        if (response.data) {
            console.log(response.data);
            res.status(200).json(response.data);
        } else {
            res.status(404).json({ message: "Family profile not found." });
        }
    } catch (error) {
        console.error("Error fetching family profile data:", error.message);
        res.status(500).json({ error: "Failed to fetch family profile data" });
    }
});

app.get('/fetch-pdf1', (req, res) => {
    try {
        // Path to the static PDF file
        const pdfPath = '/Users/abiali/Desktop/ows_node/profile.pdf';

        console.log("HERE");
        console.log(pdfPath);

        const pdfData = fs.readFileSync(pdfPath);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline; filename="profile.pdf"');

        // Send the PDF byte data directly
        res.send(pdfData);
    } catch (error) {
        console.error('Error reading the PDF file:', error.message);
        res.status(500).json({ error: 'Failed to send PDF file' });
    }
});

app.get('/fetch-pdf:its', async (req, res) => {

    const its = req.params.its
    try {
        const pdfUrl = `https://paktalim.com/admin/ws_app/GetProfilePDF/${its}?access_key=2f1d0195f15f9e527665b4a87e958586a4da8de1&username=40459629`;

        console.log("Fetching PDF from URL:", pdfUrl);

        const response = await axios.get(pdfUrl, { responseType: 'arraybuffer' });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline; filename="profile.pdf"');

        res.send(response.data);
    } catch (error) {
        console.error('Error fetching the PDF file:', error.message);
        res.status(500).json({ error: 'Failed to fetch PDF file' });
    }
});

// Start Server
const PORT = 3002;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
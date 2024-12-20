import axios from "axios";
import { createCanvas, loadImage } from "canvas"
import { v2 as cloudinary } from 'cloudinary'
import { Readable } from "node:stream";
import * as Sentry from "@sentry/node"

export async function createEventPoster(homeLogo: string, awayLogo: string): Promise<string> {
    const canvasWidth = 1280; // Width of the poster
    const canvasHeight = 720; // Height of the poster
    const canvas = createCanvas(canvasWidth, canvasHeight);
    const ctx = canvas.getContext('2d');

    // Fill the background with white color
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Load logos
    const imageA = await axios.get(homeLogo, { responseType: "arraybuffer" })
    const imageB = await axios.get(awayLogo, { responseType: "arraybuffer" })
    const logoA = await loadImage(imageA.data);
    const logoB = await loadImage(imageB.data);

    // Resize logos if needed
    const logoWidth = 300; // Desired logo width
    const logoHeight = 300; // Desired logo height

    // Calculate positions to center the logos with space between them
    const totalSpace = canvasWidth - 2 * logoWidth; // Space for two logos
    const gap = totalSpace / 3; // Space between logos and sides
    const yCenter = (canvasHeight - logoHeight) / 2; // Center logos vertically

    const xA = gap; // Position of logo A
    const xB = gap * 2 + logoWidth; // Position of logo B

    // Draw logos on canvas
    ctx.drawImage(logoA, xA, yCenter, logoWidth, logoHeight);
    ctx.drawImage(logoB, xB, yCenter, logoWidth, logoHeight);

    // Save the canvas as an image file
    const buffer = canvas.toBuffer('image/png');        
    const url: string = await new Promise((resolve) => {
        try {

            const stream = new Readable();
            stream.push(buffer);
            stream.push(null)
            const resulte = cloudinary.uploader.upload_stream({ folder: "ppvstream-cricket" }, (err, resp) => {
                resolve(resp?.secure_url ?? "")
            })
            stream.pipe(resulte)
        } catch (error) {
            Sentry.captureException(error)
            resolve("https://placehold.co/600x400.png")
        }
    })
    return url

}

export async function createFootbalPoster({ homeTeam, awayTeam, league }: { homeTeam: string, awayTeam: string, league: string }) {
    try {
        const posterWidth = 1280; // in pixels
        const posterHeight = 720; // in pixels

        // Image dimensions and gap
        const smallImageWidth = 300;
        const smallImageHeight = 300;
        const largeImageWidth = 280;
        const largeImageHeight = 280;
        const gap = 120;
        const canvas = createCanvas(posterWidth, posterHeight);
        const ctx = canvas.getContext('2d');

        // Fill the background
        ctx.fillStyle = '#ffffff'; // White background
        ctx.fillRect(0, 0, posterWidth, posterHeight);

        // Load the images
        const [img1, img2, img3] = [await loadImage((await axios.get(homeTeam, { responseType: "arraybuffer" })).data), await loadImage((await axios.get(league, { responseType: "arraybuffer" })).data), await loadImage((await axios.get(awayTeam, { responseType: "arraybuffer" })).data)]
        // Calculate positions for the images
        const centerX = posterWidth / 2;
        const centerY = posterHeight / 2;

        const img1X = centerX - largeImageWidth / 2 - smallImageWidth - gap;
        const img1Y = centerY - smallImageHeight / 2;

        const img2X = centerX - largeImageWidth / 2;
        const img2Y = centerY - largeImageHeight / 2;

        const img3X = centerX + largeImageWidth / 2 + gap;
        const img3Y = centerY - smallImageHeight / 2;

        // Draw the images on the canvas
        ctx.drawImage(img1, img1X, img1Y, smallImageWidth, smallImageHeight);
        ctx.drawImage(img2, img2X, img2Y, largeImageWidth, largeImageHeight);
        ctx.drawImage(img3, img3X, img3Y, smallImageWidth, smallImageHeight);

        // Save the canvas to a file
        const buffer = canvas.toBuffer('image/png');        
        const url: string = await new Promise((resolve) => {
            try {

                const stream = new Readable();
                stream.push(buffer);
                stream.push(null)
                const resulte = cloudinary.uploader.upload_stream({ folder: "ppvstream-soccer" }, (err, resp) => {
                    resolve(resp?.secure_url ?? "")
                })
                stream.pipe(resulte)
            } catch (error) {
                Sentry.captureException(error)
                resolve("https://placehold.co/600x400.png")
            }
        })
        return url        
    } catch (error) {
        Sentry.captureException(error)
        return ""
    }
}
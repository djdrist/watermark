const Jimp = require('jimp');
const inquirer = require('inquirer');
const fs = require('fs');

const editImage = async function (inputFile, editType) {
	try {
		const image = await Jimp.read(inputFile);
		switch (editType) {
			case 'make image brighter':
				image.brightness(0.5);
				break;
			case 'increase contrast':
				image.contrast(0.5);
				break;
			case 'make image b&w':
				image.greyscale();
				break;
			case 'invert image':
				image.invert();
				break;
		}
		image.write(inputFile);
	} catch (error) {
		console.log('Something went wrong... Try again.');
	}
};

const addTextWatermarkToImage = async function (inputFile, outputFile, text) {
	try {
		const image = await Jimp.read(inputFile);
		const font = await Jimp.loadFont(Jimp.FONT_SANS_32_BLACK);
		const textData = {
			text,
			alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
			alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE,
		};

		image.print(font, 0, 0, textData, image.getWidth(), image.getHeight());
		await image.quality(100).writeAsync(outputFile);
	} catch (error) {
		console.log('Something went wrong... Try again.');
	}
	console.log('Image created');
	startApp();
};

const addImageWatermarkToImage = async function (inputFile, outputFile, watermarkFile) {
	try {
		const image = await Jimp.read(inputFile);
		const watermark = await Jimp.read(watermarkFile);
		const x = image.getWidth() / 2 - watermark.getWidth() / 2;
		const y = image.getHeight() / 2 - watermark.getHeight() / 2;

		image.composite(watermark, x, y, {
			mode: Jimp.BLEND_SOURCE_OVER,
			opacitySource: 0.5,
		});
		await image.quality(100).writeAsync(outputFile);
	} catch (error) {
		console.log('Something went wrong... Try again.');
	}
	console.log('Image created');
	startApp();
};

const prepareOutputFilename = (filename) => {
	const [name, ext] = filename.split('.');
	return `${name}-with-watermark.${ext}`;
};

const startApp = async () => {
	// Ask if user is ready
	const answer = await inquirer.prompt([
		{
			name: 'start',
			message: 'Hi! Welcome to "Watermark manager". Copy your image files to `/img` folder. Then you\'ll be able to use them in the app. Are you ready?',
			type: 'confirm',
		},
	]);

	if (!answer.start) process.exit();

	const input = await inquirer.prompt([
		{
			name: 'inputImage',
			type: 'input',
			message: 'What file do you want to mark?',
			default: 'test.jpg',
		},
	]);

	const edit = await inquirer.prompt([
		{
			name: 'edition',
			type: 'confirm',
			message: 'Would You like to edit the image?',
		},
	]);

	if (edit.edition) {
		const answer = await inquirer.prompt([
			{
				name: 'editType',
				type: 'list',
				choices: ['make image brighter', 'increase contrast', 'make image b&w', 'invert image'],
			},
		]);
		if (fs.existsSync('./img/' + input.inputImage)) {
			await editImage('./img/' + input.inputImage, answer.editType);
		} else {
			console.log('Something went wrong... Try again.');
		}
	}

	const options = await inquirer.prompt([
		{
			name: 'watermarkType',
			type: 'list',
			choices: ['Text watermark', 'Image watermark'],
		},
	]);

	if (options.watermarkType === 'Text watermark') {
		const text = await inquirer.prompt([
			{
				name: 'value',
				type: 'input',
				message: 'Type your watermark text:',
			},
		]);
		options.watermarkText = text.value;
		if (fs.existsSync('./img/' + input.inputImage)) {
			addTextWatermarkToImage('./img/' + input.inputImage, './img/' + prepareOutputFilename(input.inputImage), options.watermarkText);
		} else {
			console.log('Something went wrong... Try again.');
		}
	} else {
		const image = await inquirer.prompt([
			{
				name: 'filename',
				type: 'input',
				message: 'Type your watermark name:',
				default: 'logo.png',
			},
		]);
		options.watermarkImage = image.filename;
		if (fs.existsSync('./img/' + input.inputImage) && fs.existsSync('./img/' + options.watermarkImage)) {
			addImageWatermarkToImage('./img/' + input.inputImage, './img/' + prepareOutputFilename(input.inputImage), './img/' + options.watermarkImage);
		} else {
			console.log('Something went wrong... Try again.');
		}
	}
};

startApp();

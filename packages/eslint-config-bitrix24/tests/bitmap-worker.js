const BitmapWorker = function() {
	self.onmessage = (event: MessageEvent): void => {
		// Hack for Safari. Workers can become unpredictable.
		// Sometimes 'self.postMessage' doesn't emit 'onmessage' event.
		setTimeout((): void => {
			createImageBitmap(event.data.message.file)
				.then((bitmap: ImageBitmap): void => {
					self.postMessage({ id: event?.data?.id, message: bitmap }, [bitmap]);
				})
				.catch((): void => {
					self.postMessage({ id: event.data.id, message: null }, []);
				})
			;
		}, 0);
	};
};

export default BitmapWorker;

let slideIndex = 0;
let images = []; // Will hold our image data

// Initial fetch parameters
let after = null; // Holds the 'name' of the last item fetched for pagination
let count = 50; // Works like 'length' to indicate the number of items to fetch


// API data fetching function — fetches both resolutions
function fetchData(correctCount) {
    // Updated API URL placeholder
    const apiUrl = `https://www.reddit.com/r/wallpapers/.json?after=${after}&count=${count}`;

    fetch(apiUrl)
        .then((response) => response.json())
        .then((data) => {
            const allData = data.data.children;
            const processedImages = allData
                .map(item => item.data)
                .filter(itemData => !itemData.is_video) // Filter out videos
                .flatMap(itemData => {
                    // Check if it's a gallery
                    if (itemData.is_gallery && itemData.media_metadata) {
                        return Object.values(itemData.media_metadata).map(metadata => {
                            // Extract mid-resolution URL
                            let midResImages = metadata.p;
                            let midIndex = Math.floor(midResImages.length / 2);
                            let lowResUrl = midResImages[midIndex].u;
                            let highResUrl = metadata.s.u;
                            return { lowResUrl, highResUrl };
                        });
                    }
                    // It's a single image
                    if (itemData.preview && itemData.preview.images) {
                        let highResUrl = itemData.url_overridden_by_dest;
                        let resolutions = itemData.preview.images[0].resolutions;
                        let midIndex = Math.floor(resolutions.length / 2);
                        let lowResItem = resolutions[midIndex];
                        let lowResUrl = lowResItem.url;

                        return [{ lowResUrl, highResUrl }];
                    }
                    return [];
                });

            images = images.concat(processedImages);
            after = images[images.length - 1]?.name; // Set the processed images
            if (images.length > 0) {
                showSlides(slideIndex); // Display the first image after processing
            }
        })
        .catch((error) => console.error('Error fetching data:', error));
}


// Show the chosen slide for a given resolution
function showSlides(n) {
    const sliderImage = document.getElementById('slide-image');
    
    if (n >= images.length) {
        slideIndex = 0; // Wrapped around to the beginning
    } else if (n < 0) {
        slideIndex = images.length - 1; // Wrap to the end
    }

    // Set the image resolution based on the checkbox state
    setResolution(slideIndex);
}

// Change the resolution of the displayed image
function setResolution(index) {
    const sliderImage = document.getElementById('slide-image');
    let resolutionKey = document.getElementById('quality-toggle').checked ? 'lowResUrl' : 'highResUrl';

    // Check if images array is not empty and the index is valid
    if(images.length > 0 && images[index]) {
        sliderImage.src = images[index][resolutionKey];
    }
}

// Change slide — triggered by previous / next buttons
function plusSlides(n) {
    showSlides(slideIndex += n);
    if(slideIndex >= images.length - length || slideIndex < top) { 
      // Fetch the next or previous batch depending on the direction
      top = slideIndex >= images.length - length ? top + length : Math.max(top - length, 0);
      fetchData(top, length);
    }
}

// Event listener for the resolution toggle
document.getElementById('quality-toggle').addEventListener('change', function() {
    setResolution(slideIndex); // Update the resolution of the currently displayed image
});

// Retrieve initial data set at full resolution
fetchData(count);

// Set up arrow navigation logic
document.querySelector('.next').addEventListener('click', function() {
    if (slideIndex >= images.length - 1) { // Check if we are at the end and need to fetch more
        fetchData(count); // Fetch next set of images based on the 'after'
    } else {
        plusSlides(1);
    }
});

document.querySelector('.prev').addEventListener('click', function() {
    plusSlides(-1);
});


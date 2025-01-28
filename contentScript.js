// XPath string of the target element
const xpath = "//*[@id='root']/div/div[2]/div[2]/div/div[1]";

// Find the target element using XPath
const targetElement = document.evaluate(
  xpath,
  document,
  null,
  XPathResult.FIRST_ORDERED_NODE_TYPE,
  null
).singleNodeValue;

// Check if the target element is found
if (targetElement) {
  // Create a button
  const button = document.createElement("button");
  button.textContent = "Download PDF";
  button.id = "custom-button";

  // Set button styles
  button.style.cursor = "pointer";
  button.style.zIndex = "1";
  button.style.alignItems = "center";
  button.style.width = "fit-content";
  button.style.fontSize = "14px";
  button.style.lineHeight = "28px";
  button.style.display = "flex";
  button.style.whiteSpace = "nowrap";
  button.style.borderRadius = "12px";
  button.style.gap = "10px";
  button.style.padding = "2px 14px";
  button.style.color = "rgb(248, 250, 255)";
  button.style.backgroundColor = "rgb(77, 107, 254)";
  button.style.transition = "background-color 0.2s ease-in-out";
  button.style.border = "none";

  // Add hover effect
  button.addEventListener("mouseover", () => {
    button.style.backgroundColor = "rgb(65, 102, 213)";
  });
  button.addEventListener("mouseout", () => {
    button.style.backgroundColor = "rgb(77, 107, 254)";
  });

  // Position the button
  button.style.position = "absolute";
  button.style.top = "10px";
  button.style.right = "10px";

  // Set parent element to relative positioning
  const parentElement = targetElement.parentElement;
  if (parentElement) {
    parentElement.style.position = "relative";
    parentElement.appendChild(button);
  }

  button.addEventListener("click", () => {
    // Set button to loading state
    button.textContent = "Loading...";
    button.disabled = true; // Disable the button

    // Call the downloadPDF function
    downloadPDF()
      .then(() => {
        // Reset button state after the PDF is generated
        button.textContent = "Download PDF";
        button.disabled = false; // Re-enable the button
      })
      .catch((error) => {
        console.error("Error generating PDF:", error);
        button.textContent = "Download PDF"; // Reset button text in case of error
        button.disabled = false; // Re-enable the button
      });
  });
} else {
  console.error("Target element with XPath not found.");
}

function downloadPDF() {
  return new Promise((resolve, reject) => {
    console.log("Downloading PDF...");

    let index = 1; // Start index
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF("p", "mm", "a4"); // Initialize jsPDF
    const pdfWidth = pdf.internal.pageSize.getWidth(); // PDF page width
    let currentHeight = 10; // Starting height for the first image
    const margin = 10; // Margin between images
    const divsProcessed = []; // Array to store processed divs

    // Loop through all divs
    while (true) {
      const xpath = `//*[@id='root']/div/div[2]/div[2]/div/div[2]/div/div/div[1]/div[${index}]`;

      const result = document.evaluate(
        xpath,
        document,
        null,
        XPathResult.FIRST_ORDERED_NODE_TYPE,
        null
      ).singleNodeValue;

      if (!result) {
        break; // No more elements found
      }

      // Check if a div with the class 'ds-markdown ds-markdown--block' exists
      const targetDiv = result.querySelector(".ds-markdown.ds-markdown--block");

      // If the target div exists, add only this div, otherwise add the entire div
      if (targetDiv) {
        divsProcessed.push(targetDiv); // Add only the specific div
      } else {
        divsProcessed.push(result); // Add the entire div
      }

      index++; // Increment index
    }

    console.log(`${divsProcessed.length} divs found. Creating PDF...`);

    // Render all divs with html2canvas and add them to the PDF
    const renderDivsToPDF = async () => {
      let pageStarted = false; // Flag to know if a page has already been started
      for (let i = 0; i < divsProcessed.length; i++) {
        const div = divsProcessed[i];

        // Render the div with html2canvas
        const canvas = await html2canvas(div, {
          scale: 2,
          backgroundColor: null,
        });
        const imgData = canvas.toDataURL("image/png");
        const imgHeight = (canvas.height * pdfWidth) / canvas.width;

        // Check if the image fits on the current page
        if (currentHeight + imgHeight > pdf.internal.pageSize.getHeight()) {
          pdf.addPage(); // Add a new page
          currentHeight = margin; // Reset height on the new page
          pageStarted = false; // Reset to ensure the background is set only once
        }

        // Set the background on the current page, only if the page is newly started
        if (!pageStarted) {
          pdf.setFillColor("#292a2d"); // Set background color to light gray
          pdf.rect(
            0,
            0,
            pdf.internal.pageSize.getWidth(),
            pdf.internal.pageSize.getHeight(),
            "F"
          ); // Draw rectangle as background
          pageStarted = true; // Background set, now we can add the image
        }

        // Add the image to the PDF
        pdf.addImage(
          imgData,
          "PNG",
          margin,
          currentHeight,
          pdfWidth - 2 * margin,
          imgHeight
        );
        currentHeight += imgHeight + margin; // Update height for the next image
      }

      // Save the PDF
      pdf.save("example.pdf");
      console.log("PDF saved.");
      resolve(); // Resolve the promise when done
    };

    renderDivsToPDF().catch((error) => {
      reject(error); // Reject the promise if there's an error
    });
  });
}

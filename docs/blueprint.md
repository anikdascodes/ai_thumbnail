# **App Name**: AI Thumbcraft

## Core Features:

- Image Upload: Allow users to upload one or multiple images to use as input for the thumbnail generation.
- Aspect Ratio Selection: Provide a dropdown menu for users to select the desired aspect ratio for the thumbnail (e.g., 16:9, 9:16, 1:1).
- Design Prompt Input: Provide a text box for users to enter a detailed prompt describing their desired thumbnail design.
- AI Thumbnail Generation: Utilize the Gemini 2.5 Flash Image Model to generate thumbnails based on the uploaded images, the provided design prompt, and the selected aspect ratio.
- Iterative Editing: Enable users to select a generated thumbnail and further refine it by providing additional or revised text prompts to the AI model. The LLM will use uploaded images as a tool.
- Display Generated Thumbnails: Display the generated thumbnails in an easily viewable format, with an option to select one for iterative editing.

## Style Guidelines:

- Primary color: Slate blue (#708090), chosen to evoke a sense of creativity.
- Background color: Very light grey (#F0F8FF) for a clean, modern aesthetic.
- Accent color: Light orange (#E9967A), contrasting well with the slate and background, bringing warmth.
- Font pairing: 'Space Grotesk' (sans-serif) for headings, and 'Inter' (sans-serif) for body text. The sans-serif combination complements the simple UI, prioritizing legibility. The choice of two fonts creates a clear visual hierarchy.
- Use a set of minimalist icons, consistently styled, to represent actions and options throughout the interface.
- Implement a clean, modern, card-based layout that's both intuitive and responsive, ensuring usability across different devices.
- Employ subtle transitions and animations for user interactions such as button presses and image loading, to provide feedback and enhance the user experience.
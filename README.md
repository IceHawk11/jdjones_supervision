# JD Jones Supervision Dashboard (AI & Coding Intern Take Home Assignment)

This is a prototype for JD Jones Production Tracking and Materials Management Dashboard built with **Vite + React + TypeScript** currently deployed as a monorepo structure on **Render** 
- [Live Link](https://jdjones-supervision.onrender.com/)
---
## Dashboard
![Dashboard](https://github.com/IceHawk11/jdjones_supervision/blob/master/pic/Screenshot%20(926).png)

## ✅ How to Run Locally

### Make sure you have installed:

- **Node.js** (Recommended: Latest LTS)
- **npm**

### 📦 Install Dependencies

Run this command using terminal in the project root directory:

```
npm install
```
Then to start the application, run
```
npm run dev
```
To view the page, simply on the web browser go to 

```
http://localhost:5000
```
## Current Limitations
- Backend is not intergrated properly
- Import/Export CSV files for the materials is not configured

## Scope for More Improvements
- Profile setup for custom users compatible with factory workers
- Connection of database (preferrably MongoDB) to save the contents of the page
- JWT Authentication setup for the users + Redis for caching
- Shipment tracker can be implemented to mark the products shipped, showcasing total profit against manufactured
- OpenCV image recognition technique can be integrated to a camera connected to the loading trucks to mark the number of items loaded or unloaded from trucks instead of manual counting



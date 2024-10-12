import React, { useState } from 'react';
import Navbar from './Navbar';
import axios from 'axios';
import { db, auth } from '../lib/firebase'; // Adjusted import to include auth
import { collection, addDoc } from 'firebase/firestore';
import Layout from './Layout';

const TheoryForm = () => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [media, setMedia] = useState(null);

    const handleFileChange = (e) => {
        setMedia(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const formData = new FormData();
        formData.append('file', media);

        try {
            // Step 1: Upload file to S3 via API route
            const { data } = await axios.post('/api/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            const mediaUrl = data.links[0];

            // Step 2: Save theory data in Firebase
            const user = auth.currentUser; // Get the current authenticated user

            if (!user) {
                console.error("User is not authenticated");
                return; // Stop if there's no user
            }

            console.log("Authenticated User ID:", user.uid); // Log the user ID for debugging

            await addDoc(collection(db, 'theories'), {
                title,
                description,
                mediaUrl,
                userId: user.uid, // Include userId here
                createdAt: new Date(),  // Optional: add a timestamp
            });

            console.log("Theory submitted successfully");
            // Optionally reset form fields after submission
            setTitle('');
            setDescription('');
            setMedia(null);
        } catch (error) {
            console.error("Error uploading image or submitting theory:", error);
        }
    };

    return (
        <Layout>
            <header className="p-2 flex items-center justify-between m-2">
                <h1 className="text-2xl font-bold text-white">Submit your Theory</h1>
            </header>
            <hr className="border-gray-300 w-full" />
            <div className="flex h-auto">
                <div className="flex-1">
                    <main className="flex-1 p-2 overflow-y-auto">
                        <div className="flex flex-col">
                            <form onSubmit={handleSubmit} className="p-2 w-full max-w-lg">
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="title">Title</label>
                                    <input
                                        id="title"
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring focus:ring-blue-500"
                                        placeholder="Enter the title of your theory"
                                        required
                                    />
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="description">Description</label>
                                    <textarea
                                        id="description"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring focus:ring-blue-500"
                                        placeholder="Describe your theory..."
                                        rows="4"
                                        required
                                    />
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="media">Media Upload</label>
                                    <input
                                        id="media"
                                        type="file"
                                        onChange={handleFileChange}
                                        className="w-full border border-gray-300 rounded-lg p-2 text-gray-700 focus:outline-none focus:ring focus:ring-blue-500"
                                    />
                                </div>

                                <button type="submit" className="w-full py-2 mt-4 bg-blue-300 text-white rounded-lg hover:bg-blue-700 transition duration-300 transform hover:scale-105">
                                    Submit Theory
                                </button>
                            </form>
                        </div>
                    </main>
                </div>
            </div>
        </Layout>
    );
};

export default TheoryForm;

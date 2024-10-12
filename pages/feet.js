import { useEffect, useState } from 'react';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/router';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import Layout from '@/components/Layout';
import Navbar from '../components/Navbar';

export default function Feed() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [theories, setTheories] = useState([]); // Holds theories with user data
  const [suggestedUsers, setSuggestedUsers] = useState([]); // Holds suggested users

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        router.push('/login');
      } else {
        setLoading(false);
        fetchTheories();
        fetchSuggestedUsers();
      }
    });
    return () => unsubscribe();
  }, [router]);

  const fetchTheories = async () => {
    try {
      const theoriesCollection = collection(db, 'theories');
      const theoriesSnapshot = await getDocs(theoriesCollection);

      const theoriesList = await Promise.all(
        theoriesSnapshot.docs.map(async (theoryDoc) => {
          const theoryData = theoryDoc.data();
          console.log("Theory Data:", theoryData); // Log theory data for debugging

          // Check if userId is present
          if (!theoryData.userId) {
            console.warn(`No userId associated with theory ID ${theoryDoc.id}`);
            return {
              id: theoryDoc.id,
              ...theoryData,
              userPhotoURL: '/default-avatar.png', // Use default avatar if no userId
              userDisplayName: 'User', // Use default name if no userId
            };
          }

          // Reference to the user
          const userRef = doc(db, 'users', theoryData.userId);
          let userData = null;

          try {
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
              userData = userSnap.data();
            } else {
              console.warn(`No user found for ID: ${theoryData.userId}`);
            }
          } catch (error) {
            console.error("Error fetching user data:", error);
          }

          return {
            id: theoryDoc.id,
            ...theoryData,
            userPhotoURL: userData?.photoURL || '/default-avatar.png',
            userDisplayName: userData?.displayName || 'User',
          };
        })
      );

      setTheories(theoriesList);
    } catch (error) {
      console.error("Error fetching theories:", error);
    }
  };

  const fetchSuggestedUsers = async () => {
    try {
      const usersCollection = collection(db, 'users');
      const usersSnapshot = await getDocs(usersCollection);
      const usersList = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setSuggestedUsers(usersList);
    } catch (error) {
      console.error("Error fetching suggested users:", error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push('/login');
    } catch (error) {
      console.error("Sign Out Error:", error.message);
    }
  };

  if (loading) {
    return <div className="text-2xl font-bold text-center mt-20">Loading...</div>;
  }

  return (
    <Layout>
      <header className="p-2 flex items-center justify-between m-2">
        <h1 className="text-2xl font-bold text-white">Feed</h1>
      </header>
      <hr className="border-t border-gray-300 mb-6 w-full" />
      <Navbar />
      <div className="flex-1 flex justify-center">
        <div className="max-w-2xl w-full p-4">
          <main className="flex flex-col mt-2 space-y-4 overflow-y-auto">
            {theories.length === 0 ? (
              <p>No theories submitted yet.</p>
            ) : (
              theories.map((theory) => (
                <div key={theory.id} className="bg-white p-4 shadow-md rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <img
                      src={theory.userPhotoURL}
                      alt={theory.userDisplayName}
                      className="w-8 h-8 rounded-full"
                    />
                    <span className="font-bold text-gray-800">{theory.userDisplayName}</span>
                  </div>
                  <h2 className="font-bold text-lg">{theory.title}</h2>
                  <div className="relative mb-4 overflow-hidden rounded-lg" style={{ maxHeight: '300px' }}>
                    {theory.mediaUrl && (
                      <img
                        src={theory.mediaUrl}
                        alt="Theory Media"
                        className="w-full h-auto transition-transform duration-300 ease-in-out transform group-hover:scale-100" // Ensure the scaling only applies to the group
                        style={{
                          maxHeight: 'auto',
                          objectFit: 'cover',
                          transition: 'transform 0.3s ease-in-out',
                        }}
                      />
                    )}
                    <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-50 transition-opacity duration-300"></div>
                  </div>
                  <p className="mt-2 text-gray-600">{theory.description}</p>
                  <div className="flex justify-between mt-4">
                    <button className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-700">
                      <span className="mr-1">❤️</span> Like
                    </button>
                    <button className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-700">
                      <span className="mr-1">💬</span> Comment
                    </button>
                    <button className="flex items-center px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-700">
                      <span className="mr-1">🔗</span> Share
                    </button>
                  </div>
                </div>
              ))
            )}
          </main>
        </div>
      </div>
    </Layout>
  );
}

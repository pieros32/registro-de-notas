import { ref } from 'vue';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from '../firebase.js';

const user = ref(null);
const authReady = ref(false);

onAuthStateChanged(auth, (u) => {
  user.value = u;
  authReady.value = true;
});

export function useAuth() {
  const login = (email, password) => signInWithEmailAndPassword(auth, email, password);
  const logout = () => signOut(auth);
  return { user, authReady, login, logout };
}

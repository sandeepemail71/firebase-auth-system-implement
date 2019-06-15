import app from 'firebase/app';
import 'firebase/auth';
import 'firebase/database';
// import * as firebase from 'firebase';
const firebase = require('firebase/app');

const config = {
   
};



class Firebase {

    constructor() {
        app.initializeApp(config);

        this.auth = app.auth();
        this.db = app.database();

        this.googleProvider = new app.auth.GoogleAuthProvider();
        this.googleProvider.setCustomParameters({
            prompt: 'select_account',
        });


        this.facebookProvider = new app.auth.FacebookAuthProvider();

    }

    // *** Auth API ***

    doCreateUserWithEmailAndPassword = (email, password) =>
        this.auth.createUserWithEmailAndPassword(email, password);

    doSignInWithEmailAndPassword = (email, password) =>
        this.auth.signInWithEmailAndPassword(email, password);

    doSignInWithGoogle = () =>
        this.auth.signInWithPopup(this.googleProvider);

    doSignInWithFacebook = () =>
        this.auth.signInWithPopup(this.facebookProvider);

    doSignOut = () => this.auth.signOut();

    doPasswordReset = email => this.auth.sendPasswordResetEmail(email);

    doPasswordUpdate = password =>
        this.auth.currentUser.updatePassword(password);

    doSendEmailVerification = () =>
        this.auth.currentUser.sendEmailVerification({
            url: 'http://localhost:3000/home',
        });

    // *** User API ***

    user = uid => this.db.ref(`users/${uid}`);

    users = () => this.db.ref('users');



    // *** Merge Auth and DB User API *** //

    onAuthUserListener = (next, fallback) =>
        this.auth.onAuthStateChanged(authUser => {
            if (authUser) {
                this.user(authUser.uid)
                    .once('value')
                    .then(snapshot => {
                        const dbUser = snapshot.val();

                        // default empty roles
                        if (!dbUser.roles) {
                            dbUser.roles = [];
                        }

                        // merge auth and db user
                        authUser = {
                            uid: authUser.uid,
                            email: authUser.email,
                            emailVerified: authUser.emailVerified,
                            providerData: authUser.providerData,
                            ...dbUser,
                        };

                        next(authUser);
                    });
            } else {
                fallback();
            }
        });
}

const authHandler = (error) => {


    if (error.code === 'auth/account-exists-with-different-credential') {
        var existingEmail = error.email;
        var pendingCred = error.credential;
        // Lookup existing account’s provider ID.
        return firebase.auth().fetchSignInMethodsForEmail(error.email)
            .then((providers) => {
                if (providers.indexOf(firebase.auth.EmailAuthProvider.PROVIDER_ID) !== -1) {
                    // Password account already exists with the same email.
                    // Ask user to provide password associated with that account.
                    var password = window.prompt('Please provide the password for ' + existingEmail);
                    return firebase.auth().signInWithEmailAndPassword(existingEmail, password);

                } 
                else if (providers.indexOf(firebase.auth.GoogleAuthProvider.PROVIDER_ID) !== -1) {
                    var googProvider = new firebase.auth.GoogleAuthProvider();
                    // Sign in user to Google with same account.
                    googProvider.setCustomParameters({ 'login_hint': existingEmail });

                    return firebase.auth().signInWithPopup(googProvider).then(function (result) {
                        return result.user;
                    });

                }
                else if (providers.indexOf(firebase.auth.GoogleAuthProvider.PROVIDER_ID) !== -1) {
                    var facebookProvider = new firebase.auth.FacebookAuthProvider();
                    // Sign in user to Google with same account.
                    facebookProvider.setCustomParameters({ 'login_hint': existingEmail });

                    return firebase.auth().signInWithPopup(facebookProvider).then(function (result) {
                        return result.user;
                    });
                }
            })
            .then(function (user) {
                // Existing email/password or Google user signed in.
                // Link Facebook OAuth credential to existing account.
                return user.linkAndRetrieveDataWithCredential(pendingCred);
            });
    }


}


export default Firebase;

export { authHandler }


import React, { useEffect, useState, useContext } from 'react';
import { StyleSheet, Text, View, Modal, TextInput, Button, Alert, ScrollView, Dimensions } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { database } from '../Firebase/firebaseSetup';
import { doc, getDoc, deleteDoc, getDocs } from 'firebase/firestore';
import { editToDB } from '../Firebase/firestoreHelper';
import { AuthContext } from '../Components/AuthContext';
import PressableItem from '../Components/PressableItem';
import { EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { collection, query, where } from 'firebase/firestore';

const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;

const Profile = ({ navigation }) => {
  const [userData, setUserData] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const { user, language } = useContext(AuthContext);

  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        const userDocRef = doc(database, 'User', user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserData(data);
          setName(data.name || '');
          setPhoneNumber(data.phoneNumber || '');
        } else {
          console.log("No such document!");
        }
      }
    };

    fetchUserData();
  }, [user]);

  const handleSave = async () => {
    if (user) {
      try {
        await editToDB(user.uid, { name, phoneNumber }, 'User');
        setUserData({ ...userData, name, phoneNumber });
        setIsModalVisible(false);
      } catch (error) {
        console.error("Failed to update profile:", error);
      }
    }
  };

  const handleNavigation = (screen) => {
    if (user) {
      navigation.navigate(screen);
    } else {
      Alert.alert(language === 'zh' ? '需要登录' : 'Login Required', language === 'zh' ? '您需要登录才能执行此操作。' : 'You need to be logged in to perform this action.', [
        { text: language === 'zh' ? '取消' : 'Cancel', style: 'cancel' },
        { text: language === 'zh' ? '登录' : 'Login', onPress: () => navigation.navigate('Login') }
      ]);
    }
  };

  const handleProceed = () => {
    setShowPasswordInput(true);
  };

  const handleDelete = async () => {
    if (password === '') {
      Alert.alert(
        language === 'zh' ? "缺少信息" : "Missing Information",
        language === 'zh' ? "请输入您的密码以确认删除您的账户，或者如果您改变主意了，请按取消！" : "Please type your password to confirm deleting your account, or \nPress Cancel if you have changed your mind!",
        [
          {
            text: language === 'zh' ? "确定" : "Ok",
            style: "Ok",
          },
        ]
      );
    } else {
      Alert.alert(
        language === 'zh' ? "最后确认" : "Final Confirmation",
        language === 'zh' ? "您确定要删除您的账户吗？此操作无法撤销。" : "Are you sure you want to delete your account? This action cannot be undone.",
        [
          {
            text: language === 'zh' ? "取消" : "Cancel",
            style: "cancel",
          },
          {
            text: language === 'zh' ? "删除" : "Delete",
            onPress: async () => {
              try {
                const credential = EmailAuthProvider.credential(user.email, password);
                await reauthenticateWithCredential(user, credential);

                // fetching listings created by the user
                const listingsQuery = query(collection(database, 'Listing'), where('createdBy', '==', user.uid));
                const listingsSnapshot = await getDocs(listingsQuery);

                // Deleting each listing posted by the user
                const deleteListingPromises = listingsSnapshot.docs.map(async (listingDoc) => {
                  await deleteDoc(listingDoc.ref);
                });
                await Promise.all(deleteListingPromises);

                // Deleting the user document from Firestore
                const userDocRef = doc(database, 'User', user.uid);
                await deleteDoc(userDocRef);

                // Deletng the user from Firebase Authentication
                await user.delete();

                // Navigating to the 'SignUp' screen
                navigation.navigate('My Home');

                // Closing the modal
                setIsDeleteModalVisible(false);
              } catch (error) {
                console.log("Error deleting account:", error);
                Alert.alert(
                  "Error Deleting Account!",
                  error.message,
                  [
                    {
                      text: "Ok",
                      style: "Ok",
                    },
                  ]
                );
              }
            },
            style: "destructive",
          },
        ]
      );
    }


  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.profileDetailsContainer}>
          {user ? (
            <>
              <Text style={styles.info}>{language === 'zh' ? '姓名: ' : 'Name: '}{userData?.name || 'N/A'}</Text>
              <Text style={styles.info}>{language === 'zh' ? '联系方式: ' : 'Email: '}{user.email}</Text>
              <Text style={styles.info}>{language === 'zh' ? '电话号码: ' : 'Phone Number: '}{userData?.phoneNumber || 'N/A'}</Text>
            </>
          ) : (
            <>
              <Text style={styles.info}>{language === 'zh' ? '姓名: 临时用户' : 'Name: Temp User '} </Text>
              <Text style={styles.info}>{language === 'zh' ? '联系方式: ' : 'Email: '}N/A</Text>
              <Text style={styles.info}>{language === 'zh' ? '电话号码: ' : 'Phone Number: '}N/A</Text>
            </>
          )}
        </View>

        <PressableItem style={styles.editButton} onPress={() => {
          if (user) {
            setIsModalVisible(true);
          } else {
            Alert.alert(
              language === 'zh' ? '需要登录' : 'Login Required',
              language === 'zh' ? '您需要登录才能编辑您的资料。' : 'You need to be logged in to edit your profile.',
              [
                { text: language === 'zh' ? '取消' : 'Cancel', style: 'cancel' },
                { text: language === 'zh' ? '登录' : 'Login', onPress: () => navigation.navigate('Login') }
              ]
            );
          }
        }}>
          <Ionicons name="pencil" size={24} color="rgb(0, 122, 255)" />
        </PressableItem>
      </View>

      <View style={styles.profileOptionsContainer}>
        <PressableItem style={styles.button} onPress={() => handleNavigation('PostListing')}>
          <Text style={styles.buttonText}>{language === 'zh' ? '发布列表' : 'Post a listing'} </Text>
        </PressableItem>
        <PressableItem style={styles.button} onPress={() => handleNavigation('PostedListings')}>
          <Text style={styles.buttonText}>{language === 'zh' ? '我的已发布列表' : 'My Posted Listings'} </Text>
        </PressableItem>
        <PressableItem style={styles.button} onPress={() => handleNavigation('ScheduledVisits')}>
          <Text style={styles.buttonText}>{language === 'zh' ? '我的预定访问' : 'My Scheduled Visits'} </Text>
        </PressableItem>
      </View>

      {user && user.uid && (
        <View style={styles.deleteAccountContainer}>
          <PressableItem style={[styles.button, { backgroundColor: 'rgb(255, 59, 48)' }]} onPress={() => setIsDeleteModalVisible(true)}>
            <Text style={styles.buttonText}>{language === 'zh' ? '删除我的账户' : 'Delete My Account'} </Text>
          </PressableItem>
        </View>
      )}

      <Modal
        animationType="slide"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => {
          setIsModalVisible(false);
        }}
      >

        <View style={styles.modalContainer}>
          <ScrollView contentContainerStyle={{ flex: 1, justifyContent: 'center', alignItems: 'center' }} keyboardShouldPersistTaps='handled'>
            <View style={styles.modalView}>
              <Text style={styles.modalTitle}>{language === 'zh' ? '编辑个人资料' : 'Edit Profile'} </Text>
              <TextInput
                style={styles.input}
                placeholder={language === 'zh' ? '姓名' : 'Name'}
                placeholderTextColor="gray"
                value={name}
                onChangeText={setName}
              />
              <TextInput
                style={styles.input}
                placeholder={language === 'zh' ? '电话号码' : 'Phone Number'}
                placeholderTextColor="gray"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
              />

              <View style={styles.accountActionsContainer}>
                <PressableItem style={styles.cancelButton} onPress={() => setIsModalVisible(false)}>
                  <Text style={styles.buttonText}>{language === 'zh' ? '取消' : 'Cancel'} </Text>
                </PressableItem>
                <PressableItem style={styles.saveButton} onPress={handleSave}>
                  <Text style={styles.buttonText}>{language === 'zh' ? '保存' : 'Save'} </Text>
                </PressableItem>
              </View>

            </View>
          </ScrollView>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        transparent={true}
        visible={isDeleteModalVisible}
        onRequestClose={() => {
          setIsModalVisible(false);
        }}
      >
        <View style={styles.modalContainer}>
          <ScrollView contentContainerStyle={{ flex: 1, justifyContent: 'center', alignItems: 'center' }} keyboardShouldPersistTaps='handled'>
            <View style={styles.modalView}>
              <Text style={styles.modalTitle}>{language === 'zh' ? '删除账户' : 'Delete Account'} </Text>
              <Text style={[styles.info, { color: 'rgb(255, 59, 48)', fontWeight: '600' }]}>
                {language === 'zh' ? '您将失去所有的访问记录以及已保存或发布的房源列表！\n您确定要继续吗？' : 'You will lose all of your visits and saved or posted listings! \nAre you sure you want to proceed?'}
              </Text>

              {!showPasswordInput && (
                <View style={styles.accountActionsContainer}>
                  <PressableItem style={styles.cancelButton} onPress={() => { setIsDeleteModalVisible(false); setShowPasswordInput(false) }}>
                    <Text style={styles.buttonText}>{language === 'zh' ? '取消' : 'Cancel'} </Text>
                  </PressableItem>
                  <PressableItem style={styles.saveButton} onPress={handleProceed}>
                    <Text style={styles.buttonText}>{language === 'zh' ? '继续' : 'Proceed'} </Text>
                  </PressableItem>
                </View>
              )}

              {showPasswordInput && (
                <>
                  <TextInput
                    style={styles.input}
                    placeholder={language === 'zh' ? '输入密码以确认' : 'Enter your password to confirm'}
                    placeholderTextColor="gray"
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                  />
                  <View style={styles.accountActionsContainer}>
                    <PressableItem style={styles.cancelButton} onPress={() => { setIsDeleteModalVisible(false); setShowPasswordInput(false) }}>
                      <Text style={styles.buttonText}>{language === 'zh' ? '取消' : 'Cancel'} </Text>
                    </PressableItem>
                    <PressableItem style={styles.saveButton} onPress={handleDelete}>
                      <Text style={styles.buttonText}>{language === 'zh' ? '删除' : 'Delete'} </Text>
                    </PressableItem>
                  </View>
                </>
              )}
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

export default Profile;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f9f9f9',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  profileDetailsContainer: {
    flex: 3
  },
  profileOptionsContainer: {
    alignItems: 'center',
    marginTop: 35,
    justifyContent: 'center',
  },
  deleteAccountContainer: {
    flex: 3,
    justifyContent: 'flex-end',
    alignItems: 'center'
  },
  button: {
    margin: 10,
    width: '52%',
    alignItems: 'center'
  },
  editButton: {
    backgroundColor: 'transparent',
    padding: 8,
    borderRadius: 10,
    marginRight: 0,
  },
  info: {
    fontSize: 16,
    marginVertical: 8,
  },
  saveButton: {
    backgroundColor: '#007BFF',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 10,
    width: '35%'
  },
  cancelButton: {
    backgroundColor: 'rgb(255, 59, 48)',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    width: '35%',
  },
  buttonText: {
    color: 'white',
    fontSize: 16
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    width: screenWidth * .8,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  input: {
    width: '100%',
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 15,
  },
  accountActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 25
  }
});

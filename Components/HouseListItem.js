import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import { ref, getDownloadURL } from 'firebase/storage';
import { storage } from '../Firebase/firebaseSetup';
import { AuthContext } from '../Components/AuthContext';

const HouseListItem = ({ house, onPress, style }) => {
    const [imageUrl, setImageUrl] = useState(null);
    const { language } = useContext(AuthContext);

    useEffect(() => {
        const fetchImageUrl = async () => {
            if (house.imageUris && house.imageUris.length > 0) {
                try {
                    const imageRef = ref(storage, house.imageUris[0]);
                    const url = await getDownloadURL(imageRef);
                    setImageUrl(url);
                } catch (error) {
                    console.error('Error fetching image URL:', error);
                }
            }
        };

        fetchImageUrl();
    }, [house.imageUris]);

    return (
        <TouchableOpacity onPress={() => onPress(house)} style={[styles.container, style]}>
            <View style={styles.left}>
                {imageUrl ? (
                    <Image source={{ uri: imageUrl }} style={styles.image} />
                ) : (
                    <AntDesign name="home" size={24} color="black" />
                )}
            </View>
            <View style={styles.right}>
                <Text style={styles.info}>{language === 'zh' ? "位置: " : "Location: "}{house.location} </Text>
                <Text style={styles.info}>{language === 'zh' ? "价格: " : "Price: "}C${house.price}/{language === 'zh' ? "月 " : "Month "}</Text>
                <Text style={styles.info}>{language === 'zh' ? "类型: " : "Type: "}{house.type} </Text>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        padding: 10,
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
    },
    left: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    right: {
        flex: 1,
        alignItems: 'flex-end',
    },
    info: {
        fontSize: 16,
        color: '#666',
        marginBottom: 5,
    },
    image: {
        width: 50,
        height: 50,
        borderRadius: 5,
    },
});

export default HouseListItem;
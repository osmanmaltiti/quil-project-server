const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();


const quilSchema = new mongoose.Schema({
  uid: {type: String, required: true},
  displayname: String,
  profileUrl: String,
  likes: [String],
  unlikes: [String],
  quil: String,
  date: Object
});
const userSchema = new mongoose.Schema({
  uid: {type: String, required: true},
  fullname: String,
  displayname: String,
  email: String,
  number: Number,
  profileUrl: String,
  createdAt: String,
  followers: [String],
  following: [String]
});

const User = mongoose.model('User', userSchema);
const Quil = mongoose.model('Quil', quilSchema);


//user profile
router.post('/', async(req, res) => {
  const { uid, fullname, displayname, 
    email, number, profileUrl, createdAt } = req.body;
   
    
    const newUser = new User({
      uid, fullname, displayname, 
      profileUrl, email, number,
      createdAt
    });
    await newUser.save();
});

router.patch('/', async(req, res) => {
  const { uid, quils, createdAt} = req.body;
  User.find({uid: uid}, (err, results) => {
    const [userData] = results;
    const {displayname, profileUrl} = userData;
    if(err){ console.log(err) }
    else{
      const newQuil = new Quil({
        uid, displayname, profileUrl,
        quil: quils, date: createdAt
      });
      newQuil.save();
      }
  });
  res.status(201).send("Quil updated")
});

router.patch('/update', async(req, res) => {
  const { uid, fullname, displayname, number } = req.body;
  console.log(req.body)

  User.updateOne({uid: uid}, {fullname, displayname, number}, (err) => {
    err && console.log(err);
  })
  res.status(201).send("User Updated")
});

router.patch('/:uid', (req, res) => {
  const { uid } = req.params;
  const { profileUrl } = req.body;
  User.updateOne({uid: uid}, { profileUrl: profileUrl }, (err) => {
    err && console.log(err);
  });
  Quil.updateMany({uid: uid}, { profileUrl: profileUrl }, (err) => {
    err && console.log(err);
  })
});

router.get('/', (req, res) => {
  User.find((err, data) => {
    res.status(201).json(data)
  })
})

//Search
router.get('/search', (req, res) => {
  User.find((err, data) => {
    const array = []
    data.forEach(item => array
                          .push({
                            uid: item.uid, 
                            fullname: item.fullname, 
                            displayname: item.displayname,
                            profileUrl: item.profileUrl
                          }));
    res.status(201).json(array)
  })
});

//Search other users
router.get('/userquery/:userId', (req, res) => {
  const {userId} = req.params;
  User.findOne({uid: userId}, (err, data) => {
    if(err) res.status(404).send(err)
    res.status(200).json(data);
  });
})

router.get('/profile/:uid', async(req, res) => {
  const {uid} = req.params;
  User.find({uid: uid}, (err, results) => {
    const [userData] = results;
    if(err){
      console.log(`Error message: ${err}`)}
      else{
        const {displayname, profileUrl, fullname, quil, followers, following, createdAt } = userData;
      res.json({
        displayname, 
        profileUrl,
        fullname,
        followers,
        following,
        createdAt,
        quil
      })};
  });
});



//quil card
router.get('/quil', (req, res) => {
  Quil.find((err, data) => {
    if(err){console.log(err)}
    else{
      res.json(data)
    }
  });
});

router.patch('/quil/like/:quilID', async(req, res) => {
  const { quilID } = req.params;
  const { uid } = req.body;
  try {
    Quil.findOne({_id: quilID}, async(err, quilData) => {
      if(err){ console.log(err) }
      else{
        let likes = quilData?.likes ? [...quilData.likes, uid] : [uid]
        const newLikes = {
          likes: [...new Set(likes)],
          unlikes: [...quilData.unlikes.filter(item => item !== uid)]
        }
        await Quil.updateOne({_id: quilID}, {...newLikes});
        res.status(201).send('Updated')
      }
    })
  } catch (error) {
    console.log(error);
    res.status(400).send(error)
  }
});

router.patch('/quil/unlike/:quilID', async(req, res) => {
  const { quilID } = req.params;
  const { uid } = req.body;
  try {
    Quil.findOne({_id: quilID}, async(err, quilData) => {
      if(err){ console.log(err) }
      else{
        const unlikes = quilData?.unlikes? [...quilData.unlikes, uid] : [uid]
        const newUnlikes = {
          unlikes: [...new Set(unlikes)],
          likes: [...quilData.likes.filter(item => item !== uid)]
        }
        await Quil.updateOne({_id: quilID}, {...newUnlikes});
  
        res.status(201).send('Updated')
      }
    })
  } catch (error) {
    console.log(error);
    res.status(400).send(error)
  }
});

router.delete('/quil/:uid/:quilID', async(req, res) => {
  const {quilID, uid} = req.params;
  try {
    Quil.deleteOne({_id: quilID, uid: uid}, (err) => err && console.log("Action not permitted"));
    res.status(201).send('quil deleted')
  } catch (error) { 
    res.status(400).send(err);
    console.log(err); }
});

router.get(`/quil/likesUnlikes/:uid`, async(req, res) => {
  const { uid } = req.params;
  Quil.find({uid: uid}, (err, quilData) => {
    if(err){ console.log(err) }
    else{
      try{
        let totalLikes = quilData.reduce((acc, init) => acc + init.likes.length, 0);
        let totalUnlikes = quilData.reduce((acc, init) => acc + init.unlikes.length, 0);
        let popularity = Math.round((totalLikes/(totalLikes + totalUnlikes)) * 100)
        User.updateOne({uid: uid}, {totalLikes, totalUnlikes, popularity});
        res.status(201).json({likes: totalLikes, unlikes: totalUnlikes, popularity});  
      }catch(err){ console.log(err); res.status(400).send(err) }
    
    }
  })
})

//follow Unfollow
router.patch('/follow/:uid', (req, res) => {
  const {uid} = req.params;
  const {data} = req.body;
  const {userId, followers} = data;

  if(followers?.includes(uid)){
    User.findOne({uid: userId}, async(err, data) => {
      if(err) res.status(404).send(err)
      let newFollowers = data.followers?.filter(item => item !== uid);
      const response = await User.updateOne({uid: userId}, {followers: newFollowers});
      
      User.findOne({uid}, async(err, userData) => {
        if(err) res.status(404).send(err)
        
        let newFollowing = userData.following?.filter(item => item !== userId)
        await User.updateOne({uid}, {following: newFollowing})
      })
      res.status(201).send("Unfollowed")
    })
  }
  else{
    User.findOne({uid: userId}, async(err, data) => {
      let newFollowers = data?.followers ? [...data.followers, uid] : [uid];
      await User.updateOne({uid: userId}, {followers: [...new Set(newFollowers)]});
      
      User.findOne({uid}, async(err, userData) => {
        if(err) res.status(404).send(err)
        let newFollowing = userData?.following ? [...userData.following, userId] : [userId]
        await User.updateOne({uid}, {following: newFollowing})
      })
      res.status(201).send("Following")
    })
  }
});

router.patch('/unfollow/:uid', (req, res) => {
  const {uid} = req.params;
  const {followingId} = req.body;
  User.find({uid: followingId}, async(err, result) => {
    if(err) {console.log(err)}
    else{
      const [data] = result;
      const newFollowers = data?.followers.filter(item => item.uid !== uid);
      
      await User.updateOne({uid: followingId}, {followers: newFollowers});
    
    
    User.find({uid}, async(err, result) => {
      if(err) {console.log(err)}
      else{
        const [data] = result;
        const newFollowing = data?.following.filter(item => item.followingId !== followingId);
        
        await User.updateOne({uid}, {following: newFollowing});
      }
    });
    res.status(201).send("Unfollowed")
    }
  })
})
module.exports = router;
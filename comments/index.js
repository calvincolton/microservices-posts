const express = require('express');
const bodyParser = require('body-parser');
const { randomBytes } = require('crypto');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());
app.use(cors());

const commentsByPostId = {};

app.get('/posts/:id/comments', (req, res) => {
  res.send(commentsByPostId[req.params.id] || []);
});

app.post('/posts/:id/comments', async (req, res) => {
  const _commentId = randomBytes(4).toString('hex');
  const { content } = req.body;

  const comments = commentsByPostId[req.params.id] || [];
  comments.push({
    id: _commentId,
    content,
    status: 'pending'
  });

  commentsByPostId[req.params.id] = comments;

  await axios.post('http://localhost:4005/events', {
    type: 'CommentCreated',
    data: {
      id: _commentId,
      content,
      _postId: req.params.id,
      status: 'pending'
    }
  })

  res.status(201).send(comments);
});

app.post('/events', async (req, res) => {
  const { type, data } = req.body;

  console.log('Event Received', type);

  if (type === 'CommentModerated') {
    const { id, _postId, content, status } = data;
    const comments = commentsByPostId[_postId]

    const comment = comments.find(comment => {
      return comment.id === id;
    });
    comment.status = status;

    await axios.post('http://localhost:4005/events', {
      type: 'CommentUpdated',
      data: {
        id,
        _postId,
        content,
        status
      }
    })
  }

  res.send({});
});

const PORT = 4001;
app.listen(PORT, () => {
  console.log(`Listending on port ${PORT}`);
})
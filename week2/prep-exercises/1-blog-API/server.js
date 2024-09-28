const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const app = express();

app.use(express.json());

const sanitizeTitle = (title) => title.replace(/[<>:"\/\\|?*]/g, '').trim();

// Create a new blog post
app.post('/blogs', async (req, res) => {
  const { title, content } = req.body;

  if (!title || !content) {
    return res.status(400).send('Title and content are required!');
  }

  const sanitizedTitle = sanitizeTitle(title);

  try {
    await fs.writeFile(`./blogs/${sanitizedTitle}.txt`, content);
    res.status(201).send('Blog post created!');
  } catch (err) {
    res.status(500).send('Error saving the blog post.');
  }
});

// Update an existing blog post
app.put('/blogs/:title', async (req, res) => {
  const title = sanitizeTitle(req.params.title);
  const { content } = req.body;

  if (!content) {
    return res.status(400).send('Content is required to update the post!');
  }

  try {
    await fs.access(`./blogs/${title}.txt`);
    await fs.writeFile(`./blogs/${title}.txt`, content);
    res.send('Blog post updated!');
  } catch (err) {
    if (err.code === 'ENOENT') {
      res.status(404).send('This post does not exist!');
    } else {
      res.status(500).send('Error updating the blog post.');
    }
  }
});

// Delete a blog post
app.delete('/blogs/:title', async (req, res) => {
  const title = sanitizeTitle(req.params.title);

  try {
    await fs.access(`./blogs/${title}.txt`);
    await fs.unlink(`./blogs/${title}.txt`);
    res.send('Blog post deleted!');
  } catch (err) {
    if (err.code === 'ENOENT') {
      res.status(404).send('This post does not exist!');
    } else {
      res.status(500).send('Error deleting the blog post.');
    }
  }
});

// Read a blog post
app.get('/blogs/:title', async (req, res) => {
  const title = sanitizeTitle(req.params.title);

  try {
    await fs.access(`./blogs/${title}.txt`);
    const data = await fs.readFile(`./blogs/${title}.txt`, 'utf8');
    res.send(data);
  } catch (err) {
    if (err.code === 'ENOENT') {
      res.status(404).send('This post does not exist!');
    } else {
      res.status(500).send('Error reading the blog post.');
    }
  }
});

// Read all blog post titles
app.get('/blogs', async (req, res) => {
  try {
    const files = await fs.readdir('./blogs');
    const blogs = files
      .filter(file => file.endsWith('.txt'))
      .map(file => ({ title: file.replace('.txt', '') }));
    res.json(blogs);
  } catch (err) {
    res.status(500).send('Error reading the directory.');
  }
});

// Start the server on port 3000
app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});

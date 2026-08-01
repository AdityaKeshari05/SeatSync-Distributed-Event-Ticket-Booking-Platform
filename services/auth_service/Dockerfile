# Start from an existing image that already has Node.js installed —
# this is the "base image." We don't build Node itself from scratch.
# "alpine" is a very small, lightweight version of Linux — smaller images
# mean faster builds and faster deploys later.
FROM node:20-alpine

# Set the working directory INSIDE the container. Every command after this
# runs relative to this folder, same idea as `cd` inside the container.
WORKDIR /app

# Copy just these two files first, before the rest of the code.
# This is a deliberate optimization, not an accident — explained below.
COPY package*.json ./

# Install dependencies INSIDE the container. This does NOT use your local
# node_modules at all — it installs fresh, inside this isolated environment.
RUN npm install

# NOW copy the rest of your actual source code.
COPY . .
ARG DATABASE_URL
ENV DATABASE_URL=$DATABASE_URL
# Generate the Prisma client inside the container — remember, this is a
# required step any time schema.prisma changes, and the container starts
# from a blank slate every time, so it needs to happen during the build.
RUN npx prisma generate

# Document which port this service listens on. This line is informational —
# it doesn't actually publish the port by itself (that happens in
# docker-compose.yml later), but it's good practice to state it here.
EXPOSE 5001

# The actual command that runs when a container starts from this image.
# Notice this is npm run dev's underlying command, not npm run dev itself —
# more on why when we get to docker-compose.
CMD ["npx", "tsx", "src/server.ts"]

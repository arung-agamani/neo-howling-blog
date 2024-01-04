"use client";
import Link from "next/link";
import PostItem from "@/components/Dashboard/PostItem";
import axios from "@/utils/axios";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import AddIcon from "@mui/icons-material/AddBox";
import Box from "@mui/material/Box";
import Pagination from "@mui/material/Pagination";
import Grid from "@mui/material/Grid";
import CircularProgress from "@mui/material/CircularProgress";
import PostItemSkeleton from "@/components/Dashboard/PostItemSkeleton";

const PAGE_SIZE = 12;

export default function Page() {
  const [posts, setPosts] = useState<any>([]);
  const [page, setPage] = useState<number>(1);
  const [paginatedPost, setPaginatedPost] = useState<any>([]);

  const handlePageChange = (event: any, page: number) => {
    setPage(page);
  };

  const fetchPosts = async () => {
    try {
      const postsRes = await axios.get("/api/dashboardv2/post/list");
      setPosts(postsRes.data.filter((x: any) => x.deleted === true));
    } catch (error) {
      console.log("Error on fetching posts");
      toast.error("Error on fetching posts");
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  useEffect(() => {
    const sel = (posts as Array<any>).slice(
      (page - 1) * PAGE_SIZE,
      (page - 1) * PAGE_SIZE + PAGE_SIZE
    );
    console.log(sel.length);
    setPaginatedPost(sel);
  }, [posts, page]);

  if (!posts)
    return (
      <Grid
        container
        spacing={0}
        direction="column"
        alignItems="center"
        justifyContent="center"
        sx={{
          minHeight: "100vh",
          backgroundColor: "white",
        }}
      >
        <CircularProgress color="primary" />
      </Grid>
    );
  return (
    <>
      <div className="px-2 py-2">
        <Link href={"/dashboard/main/posts/edit"}>
          <Paper elevation={3}>
            <div className="p-4 flex">
              <IconButton>
                <AddIcon />
              </IconButton>
              <Typography variant="h4" color={"text.primary"}>
                New Post
              </Typography>
            </div>
          </Paper>
        </Link>
      </div>
      <Box
        sx={{
          padding: "0.5rem 0.5rem",
        }}
        justifyContent="center"
        alignItems={"center"}
        display="flex"
      >
        <Pagination
          color="secondary"
          count={Math.ceil(posts.length / PAGE_SIZE)}
          onChange={handlePageChange}
        />
      </Box>
      <div className="grid grid-cols-4 gap-2 px-2">
        {paginatedPost
          ? paginatedPost
              .filter((x: any) => x.deleted === true)
              .map((post: any) => (
                <PostItem key={post.id} post={post} reloadPosts={fetchPosts} />
              ))
          : [0, 1, 2, 3, 4].map((i) => {
              return <PostItemSkeleton key={i} />;
            })}
      </div>
    </>
  );
}

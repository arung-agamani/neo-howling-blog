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
import Modal from "@mui/material/Modal";
import CircularProgress from "@mui/material/CircularProgress";
import PostItemSkeleton from "@/components/Dashboard/PostItemSkeleton";
import Button from "@mui/material/Button";

const PAGE_SIZE = 12;

const style = {
  position: "absolute" as "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 400,
  bgcolor: "background.paper",
  border: "2px solid #000",
  boxShadow: 24,
  p: 4,
};

export default function Page() {
  const [posts, setPosts] = useState<any[]>([]);
  const [page, setPage] = useState<number>(1);
  const [paginatedPost, setPaginatedPost] = useState<any>([]);
  const [selectedPostId, setSelectedPostId] = useState<string>("");
  const [modalOpen, setModalOpen] = useState<boolean>(false);

  /** Modal Logic */
  const toggleModal = (val: boolean) => setModalOpen(val);
  const handleClose = () => {
    setModalOpen(false);
    setSelectedPostId("");
  };
  const deleteModal = async (id: string) => {
    setSelectedPostId(id);
    setModalOpen(true);
  };
  const hardDeleteHandler = async () => {
    const id = selectedPostId;
    try {
      const deleteRes = await axios.delete(
        `/api/dashboardv2/post/delete?id=${id}&hard`
      );
      toast.success("Post deleted!", {
        position: toast.POSITION.TOP_LEFT,
      });
      fetchPosts();
    } catch (error) {
      console.log("Error when deleting post");
      console.error(error);
      toast.error("Error when deleting post");
    } finally {
      handleClose();
    }
  };

  /** Data Fetch Logic */
  const handlePageChange = (event: any, page: number) => {
    setPage(page);
  };

  const fetchPosts = async () => {
    try {
      const postsRes = await axios.get("/api/dashboardv2/post/list");
      setPosts(postsRes.data.filter((x: any) => x.deleted !== true));
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
      <Modal open={modalOpen} onClose={handleClose}>
        <Box sx={style}>
          <Typography>Selected Post ID: {selectedPostId}</Typography>
          <Typography>
            Title:{" "}
            {selectedPostId && posts.find((x) => x.id === selectedPostId).title}
          </Typography>
          <Typography variant="h5">
            Are you sure to delete this post?{" "}
          </Typography>
          <Typography variant="body1">
            <i>This action cannot be undone</i>
          </Typography>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="contained"
              color="info"
              onClick={() => handleClose()}
            >
              No
            </Button>
            <Button
              variant="contained"
              color="warning"
              onClick={() => hardDeleteHandler()}
            >
              Yes
            </Button>
          </div>
        </Box>
      </Modal>
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
              .filter((x: any) => x.deleted !== true)
              .map((post: any) => (
                <PostItem
                  key={post.id}
                  post={post}
                  reloadPosts={fetchPosts}
                  interaction="modal"
                  onDeleteModal={deleteModal}
                />
              ))
          : [0, 1, 2, 3, 4].map((i) => {
              return <PostItemSkeleton key={i} />;
            })}
      </div>
    </>
  );
}

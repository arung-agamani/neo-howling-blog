"use client";

import axios from "@/utils/axios";
import Link from "next/link";
import React, { useRef, useState } from "react";
import { toast } from "react-toastify";
import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import OpenInNew from "@mui/icons-material/OpenInNew";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import PublishIcon from "@mui/icons-material/Publish";
import Tooltip from "@mui/material/Tooltip";
interface PostData {
  title: string;
  link: string | null;
  tags: string[];
  description: string;
  bannerUrl: string | null;
  isBannerDark: boolean | null;
  isPublished: boolean | null;
  datePosted: Date;
  id: string;
  updatedAt?: Date;
  deleted?: Boolean;
  deletedAt?: Date;
}

interface Props {
  post: PostData;
  reloadPosts?: () => Promise<void>;
  interaction?: "direct" | "modal";
  onDeleteModal?: (id: string) => Promise<void>;
}

const PostItem: React.FC<Props> = ({
  post,
  reloadPosts,
  interaction = "direct",
  onDeleteModal,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [popupMenu, setPopupMenu] = useState<HTMLDivElement | null>(null);
  const openOption = () => {
    if (popupMenu) {
      popupMenu.remove();
      setPopupMenu(null);
      return;
    }
    console.log(post.id);
    const popupDiv = document.createElement("div");
    const ul = document.createElement("ul");
    popupDiv.appendChild(ul);
    ["item1", "item2", "item3"].map((item) => {
      const el = document.createElement("li");
      el.innerText = item;
      el.className = "px-2 py-2 hover:bg-slate-300 w-20";
      ul.addEventListener("click", (e) => {
        e.preventDefault();
        console.log(item);
      });
      ul.appendChild(el);
    });
    popupDiv.style.position = "absolute";
    popupDiv.className = "border border-slate-700 bg-slate-50 text-slate-800";
    ref.current?.appendChild(popupDiv);
    setPopupMenu(popupDiv);
  };

  const deleteHandler = async (id: string) => {
    try {
      const deleteRes = await axios.delete(
        `/api/dashboardv2/post/delete?id=${id}`
      );
      toast.success("Post deleted!", {
        position: toast.POSITION.TOP_LEFT,
      });
      if (reloadPosts) {
        reloadPosts();
      } else {
        setTimeout(() => {
          window.location.reload();
        }, 3000);
      }
    } catch (error) {
      console.log("Error when deleting post");
      console.error(error);
      toast.error("Error when deleting post");
    }
  };

  const hardDeleteHandler = async (id: string) => {
    if (interaction === "modal" && onDeleteModal) {
      return onDeleteModal(id);
    }
    try {
      const deleteRes = await axios.delete(
        `/api/dashboardv2/post/delete?id=${id}&hard`
      );
      toast.success("Post deleted!", {
        position: toast.POSITION.TOP_LEFT,
      });
      if (reloadPosts) {
        reloadPosts();
      } else {
        setTimeout(() => {
          window.location.reload();
        }, 3000);
      }
    } catch (error) {
      console.log("Error when deleting post");
      console.error(error);
      toast.error("Error when deleting post");
    }
  };

  const publishHandler = async () => {
    try {
      const publishRes = await axios.post(`/api/dashboardv2/post/update`, {
        id: post.id,
        isPublished: !post.isPublished,
        op: "publish",
      });
      let msg = post.isPublished ? "Post unpublished" : "Post published";
      toast.success(msg, {
        position: toast.POSITION.TOP_LEFT,
      });
      setTimeout(() => {
        window.location.reload();
      }, 3000);
    } catch (error) {
      console.log("Error when (un)publishing post");
      console.error(error);
      toast.error("Error when (un)publishing post");
    }
  };
  return (
    <Card
      className="flex flex-col bg-gray-100"
      sx={{
        // color: "#0B132B",
        "& .MuiSvgIcon-root": {
          color: "#947EB0",
        },
        backgroundColor: "rgb(243 244 246)",
      }}
    >
      <CardContent className="flex-grow">
        <Typography color="text.secondary" gutterBottom>
          {post.updatedAt
            ? new Date(post.updatedAt).toLocaleString()
            : "No update record"}
        </Typography>
        <Typography variant="h5" component="div" color="text.primary">
          {post.title}
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ marginTop: "1rem" }}
        >
          {post.description}
        </Typography>
        {/* <div className="mt-6">
                    {post.tags.map((tag) => (
                        <Chip
                            key={tag}
                            className="mx-1 first:ml-0"
                            label={tag}
                        />
                    ))}
                </div> */}
      </CardContent>
      <CardActions disableSpacing className="align-bottom">
        <Link
          href={`/post/${post.id}`}
          rel="noopener noreferrer"
          target="_blank"
        >
          <Tooltip title="Open">
            <IconButton>
              <OpenInNew />
            </IconButton>
          </Tooltip>
        </Link>
        <Link
          href={{
            pathname: "/dashboard/main/posts/edit",
            query: {
              id: post.id,
            },
          }}
        >
          <Tooltip title="Edit">
            <IconButton>
              <EditIcon />
            </IconButton>
          </Tooltip>
        </Link>
        <Tooltip title="Delete">
          <IconButton
            onClick={() => {
              deleteHandler(post.id);
            }}
          >
            <DeleteIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Hard Delete">
          <IconButton
            onClick={() => {
              hardDeleteHandler(post.id);
            }}
          >
            <DeleteIcon style={{ color: "red" }} />
          </IconButton>
        </Tooltip>
        <Tooltip title="Publish">
          <IconButton
            onClick={() => {
              publishHandler();
            }}
          >
            <PublishIcon />
          </IconButton>
        </Tooltip>
        <Typography>
          {post.isPublished ? "Published" : "Not Published"}
        </Typography>
      </CardActions>
    </Card>
  );
  {
    /* <div
    className="bg-slate-600 text-slate-100 mb-2 flex mx-2"
    key={post.title}
>
    <div
        className="h-full px-2 self-center hover:cursor-pointer"
        // onClick={openOption}
        ref={ref}
    >
        <svg
            style={{
                verticalAlign: "-0.125em",
            }}
            fill="currentColor"
            height="1em"
            width="1em"
            viewBox="0 0 192 512"
            aria-hidden="true"
            role="img"
        >
            <path
                d="M96 184c39.8 0 72 32.2 72 72s-32.2 72-72 72-72-32.2-72-72 32.2-72 72-72zM24 80c0 39.8 32.2 72 72 72s72-32.2 72-72S135.8 8 96 8 24 40.2 24 80zm0 352c0 39.8 32.2 72 72 72s72-32.2 72-72-32.2-72-72-72-72 32.2-72 72z"
                transform=""
            ></path>
        </svg>
    </div>
    <div className="py-4 px-2 pl-4 border-l border-slate-600 bg-slate-700 w-full">
        <p className="text-2xl">
            {post.title}
            {post.deleted && (
                <span className="ml-4 mr-4 font-bold bg-red-600 px-2 text py-0.5 rounded-lg text-slate-100">
                    Deleted
                </span>
            )}
        </p>
        <p className="text-md  text-slate-300">{post.description}</p>
        <p className="text-md text-slate-300">
            Last Updated:{" "}
            {post.updatedAt
                ? new Date(post.updatedAt).toLocaleString()
                : "No update record"}
        </p>
        <p className="mb-3">Tags: {post.tags.join(", ")}</p>
        <p>
            <Link
                href={`/post/${post.id}`}
                rel="noopener noreferrer"
                target="_blank"
            >
                <span className="mr-4 font-bold bg-blue-600 px-2 text py-0.5 rounded-lg text-slate-100 hover:bg-white hover:cursor-pointer">
                    Open
                </span>
            </Link>
            <Link
                href={{
                    pathname: "/dashboard/main/posts/edit",
                    query: {
                        id: post.id,
                    },
                }}
            >
                <span className="mr-4 font-bold bg-orange-600 px-2 text py-0.5 rounded-lg text-slate-100 hover:bg-white hover:cursor-pointer">
                    Edit
                </span>
            </Link>
            <span
                className="mr-4 font-bold bg-red-600 px-2 text py-0.5 rounded-lg text-slate-100 hover:bg-white hover:cursor-pointer"
                onClick={() => deleteHandler(post.id)}
            >
                Delete
            </span>
            {post.isPublished ? (
                <span
                    className="mr-4 font-semibold text-slate-100 px-2 text py-0.5 rounded-lg bg-green-500 hover:cursor-pointer"
                    onClick={publishHandler}
                >
                    Published
                </span>
            ) : (
                <span
                    className="mr-4 font-semibold text-slate-100 px-2 text py-0.5 rounded-lg bg-gray-500 hover:cursor-pointer"
                    onClick={publishHandler}
                >
                    Not Published
                </span>
            )}
        </p>
    </div>
</div> */
  }
};

export default PostItem;

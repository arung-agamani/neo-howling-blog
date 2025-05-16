"use client";

import axios from "@/utils/axios";
import CircularProgress from "@mui/material/CircularProgress";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import Skeleton from "@mui/material/Skeleton";
import { useAppSelector } from "@/stores/hooks";
import { useQuery } from "@tanstack/react-query";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Box from "@mui/material/Box";

interface UserCred {
    user: {
        role?: string;
        username: string;
    };
}

interface RecentPost {
    id: string;
    title: string;
    description: string;
}

interface Tag {
    name: string;
    count: number;
}

interface Stats {
    total: number;
    unpublished: number;
    recentPosts: RecentPost[];
    untaggedPosts: RecentPost[];
    tags: Tag[];
}

export default function Page() {
    const user = useAppSelector((state) => state.user);
    const { data: stats, isSuccess } = useQuery({
        queryKey: ["statsData"],
        queryFn: async () => {
            const { data } = await axios.get("/api/dashboardv2");
            return data.stats as Stats;
        },
        staleTime: 60000,
    });

    if (!isSuccess)
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
                <title>Dashboard - Loading...</title>
            </Grid>
        );

    return (
        <div className="px-4 py-4">
            <title>Dashboard - Howling Blog</title>
            {/* Dashboard Overview - full width row */}
            <Paper elevation={2} className="px-4 py-4" sx={{ mb: 3 }}>
                <Typography variant="h4" sx={{ mb: 1 }}>
                    Hello, {user.username}!
                </Typography>
                <Typography variant="body1">
                    Last Login: {new Date().toLocaleString()}
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                    You have {stats.total} posts,{" "}
                    {stats.total - stats.unpublished} published,{" "}
                    {stats.unpublished} draft
                </Typography>
            </Paper>
            {/* Main columns */}
            <Box sx={{ display: "flex", gap: 3 }}>
                {/* Left Column: Recent Posts */}
                <Box sx={{ flex: 1, minWidth: 320 }}>
                    <Paper elevation={2} className="px-4 py-4" sx={{ mb: 2 }}>
                        <Box
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                mb: 2,
                            }}
                        >
                            <Typography variant="h5">Recent Posts</Typography>
                            <Typography
                                variant="body2"
                                sx={{
                                    color: "#1976d2",
                                    cursor: "pointer",
                                    textDecoration: "underline",
                                    fontWeight: 500,
                                }}
                                onClick={() =>
                                    (window.location.href =
                                        "/dashboard/main/posts")
                                }
                            >
                                View all
                            </Typography>
                        </Box>
                        <Divider />
                        <List>
                            {stats.total === -1
                                ? [0, 1, 2, 3, 4].map((i) => (
                                      <ListItem
                                          key={i}
                                          sx={{
                                              borderBottom: "1px solid #eee",
                                              px: 0,
                                              py: 1.5,
                                          }}
                                          disablePadding
                                      >
                                          <Box sx={{ width: "100%" }}>
                                              <Skeleton
                                                  variant="text"
                                                  width="80%"
                                                  height={28}
                                              />
                                              <Skeleton
                                                  variant="text"
                                                  width="60%"
                                                  height={20}
                                              />
                                          </Box>
                                      </ListItem>
                                  ))
                                : stats.recentPosts.map((post) => (
                                      <ListItem
                                          key={post.id}
                                          sx={{
                                              borderBottom: "1px solid #eee",
                                              px: 0,
                                              py: 1.5,
                                              alignItems: "flex-start",
                                              "&:last-child": {
                                                  borderBottom: 0,
                                              },
                                          }}
                                          disablePadding
                                      >
                                          <Box sx={{ width: "100%" }}>
                                              <Typography
                                                  variant="subtitle1"
                                                  fontWeight={600}
                                                  sx={{
                                                      mb: 0.5,
                                                      fontSize: 17,
                                                      color: "#1976d2",
                                                      cursor: "pointer",
                                                      "&:hover": {
                                                          textDecoration:
                                                              "underline",
                                                      },
                                                  }}
                                                  onClick={() =>
                                                      (window.location.href = `/dashboard/main/posts/edit?id=${post.id}`)
                                                  }
                                              >
                                                  {post.title}
                                              </Typography>
                                              <Typography
                                                  variant="body2"
                                                  color="text.secondary"
                                                  sx={{ fontSize: 14 }}
                                              >
                                                  {post.description}
                                              </Typography>
                                          </Box>
                                      </ListItem>
                                  ))}
                        </List>
                    </Paper>
                </Box>
                {/* Tags-related Column */}
                <Box sx={{ flex: 1, minWidth: 280 }}>
                    <Paper elevation={2} className="px-4 py-4" sx={{ mb: 2 }}>
                        <Typography variant="h6" sx={{ mb: 1 }}>
                            Untagged Posts
                        </Typography>
                        <Divider />
                        <List dense>
                            {stats.total === -1
                                ? [0, 1, 2, 3, 4].map((i) => (
                                      <ListItem key={i}>
                                          <Skeleton
                                              variant="text"
                                              width={180}
                                          />
                                      </ListItem>
                                  ))
                                : stats.untaggedPosts.map((post) => (
                                      <ListItem key={post.id}>
                                          <ListItemText
                                              primary={post.title}
                                              primaryTypographyProps={{
                                                  noWrap: true,
                                                  fontSize: 15,
                                              }}
                                          />
                                      </ListItem>
                                  ))}
                        </List>
                    </Paper>
                    <Paper elevation={2} className="px-4 py-4">
                        <Box
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                mb: 1,
                            }}
                        >
                            <Typography variant="h6">Top Tags</Typography>
                            <Typography
                                variant="body2"
                                sx={{
                                    color: "#1976d2",
                                    cursor: "pointer",
                                    textDecoration: "underline",
                                    fontWeight: 500,
                                }}
                                onClick={() =>
                                    (window.location.href =
                                        "/dashboard/main/tags")
                                }
                            >
                                View all
                            </Typography>
                        </Box>
                        <Divider />
                        <Box
                            sx={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: 1,
                                mt: 2,
                            }}
                        >
                            {stats.tags.slice(0, 10).map((tag) => (
                                <Box
                                    key={tag.name}
                                    sx={{
                                        border: "1px solid #1976d2",
                                        borderRadius: 2,
                                        px: 1.5,
                                        py: 0.5,
                                        bgcolor: "#e3f2fd",
                                        minWidth: 80,
                                        textAlign: "center",
                                        cursor: "pointer",
                                        "&:hover": { bgcolor: "#bbdefb" },
                                    }}
                                    onClick={() =>
                                        (window.location.href = `/dashboard/main/tags?tag=${encodeURIComponent(
                                            tag.name
                                        )}`)
                                    }
                                >
                                    <Typography
                                        variant="body2"
                                        fontWeight={600}
                                    >
                                        {tag.name}
                                    </Typography>
                                    <Typography
                                        variant="caption"
                                        color="text.secondary"
                                    >
                                        {tag.count} posts
                                    </Typography>
                                </Box>
                            ))}
                        </Box>
                    </Paper>
                </Box>
                {/* Future Features Column */}
                <Box sx={{ flex: 1, minWidth: 280 }}>
                    <Paper elevation={2} className="px-4 py-4" sx={{ mb: 2 }}>
                        <Typography variant="h6" sx={{ mb: 2 }}>
                            Dashboard Features
                        </Typography>
                        <Divider sx={{ mb: 2 }} />
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <Card>
                                    <CardContent>
                                        <Typography variant="subtitle1">
                                            Site Views
                                        </Typography>
                                        <Skeleton
                                            variant="rectangular"
                                            width={120}
                                            height={32}
                                        />
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid item xs={12}>
                                <Card>
                                    <CardContent>
                                        <Typography variant="subtitle1">
                                            Comments
                                        </Typography>
                                        <Skeleton
                                            variant="rectangular"
                                            width={120}
                                            height={32}
                                        />
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid item xs={12}>
                                <Card>
                                    <CardContent>
                                        <Typography variant="subtitle1">
                                            Scheduled Posts
                                        </Typography>
                                        <Skeleton
                                            variant="rectangular"
                                            width={120}
                                            height={32}
                                        />
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid item xs={12}>
                                <Card>
                                    <CardContent>
                                        <Typography variant="subtitle1">
                                            Plugin Updates
                                        </Typography>
                                        <Skeleton
                                            variant="rectangular"
                                            width={120}
                                            height={32}
                                        />
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>
                    </Paper>
                </Box>
            </Box>
        </div>
    );
}

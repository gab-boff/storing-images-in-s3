import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

import "./styles.scss";

export default function Home() {
  const [file, setFile] = useState<any>();
  const [caption, setCaption] = useState("");

  const [images, setImages] = useState<any>();

  const navigate = useNavigate();

  useEffect(() => {
    const response = async () => {
      const response = await axios.get("http://localhost:8000/api/images");
      setImages(response);
    }

    response();
  }, []);

  const handleSubmit = async (
    event: React.FormEvent<HTMLInputElement> | any
  ) => {
    event.preventDefault();

    const formData = new FormData();
    formData.append("image", file);
    formData.append("caption", caption);
    const response = await axios.post(
      "http://localhost:8000/api/images",
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    );

    navigate("/");
    return response;
  };

  const handleDelete = async (id: string) => {
    const response = await axios.delete(`http://localhost:8000/api/images/${id}`);
    return response;
  };

  const fileSelected = (event: any) => {
    const file = event.target.files[0];
    setFile(file);
  };

  return (
    <div className="container">
      <form className="form" onSubmit={handleSubmit}>
        <input onChange={fileSelected} type="file" accept="image/*" />
        <input
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          type="text"
          placeholder="Caption"
        />
        <button className="submit-button" type="submit">Submit</button>
      </form>
      <section>
        {images?.data?.map((image: any) => (
          <div className="image-container" key={image.id}>
            <img src={image.imageUrl} alt={image.caption} />
            <p>{image.caption}</p>
            <button onClick={() => handleDelete(image.id)}>Delete</button>
          </div>
        ))}
      </section>
    </div>
  );
}

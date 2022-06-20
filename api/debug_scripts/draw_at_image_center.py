import cv2
import sys

if __name__ == "__main__":
    image_path = sys.argv[1]
    im = cv2.imread(image_path)
    window = cv2.namedWindow('image', cv2.WINDOW_NORMAL)
    cv2.resizeWindow('image', im.shape[1]//2, im.shape[0]//2)

    # draws a circle at the image center
    cv2.circle(im, (im.shape[1]//2, im.shape[0]//2), 5, (0, 0, 255), -1)

    cv2.imwrite(image_path, im)

    # cv2.imshow('image', im)
    # cv2.waitKey(0)